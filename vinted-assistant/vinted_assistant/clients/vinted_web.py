"""Client Vinted réel, piloté par Playwright dans TON navigateur connecté.

- Profil Chromium persistant : tu te connectes une fois (`python main.py login`),
  le mot de passe n'est jamais lu ni stocké par l'outil.
- Les lectures passent par les appels internes que le site web fait lui-même
  (fetch dans la page, avec tes cookies), les écritures « sensibles » (offre aux
  favoris) passent par l'interface.
- Chaque requête est précédée d'un délai humain et comptée dans le plafond de lectures.
- Toute réponse 429/403, captcha ou message d'avertissement => arrêt immédiat.

Vinted change régulièrement son site : les chemins d'API sont surchargeables dans
config.yaml (vinted.endpoints) et les sélecteurs d'interface sont regroupés ici.
"""
from __future__ import annotations

import base64
import json
import logging
import re
import time
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

from ..safety import Guard
from .base import Conversation, FeatureUnavailable, Item, Message

log = logging.getLogger("vinted")

ENDPOINTS = {
    "inbox": "/api/v2/inbox",
    "conversation": "/api/v2/conversations/{id}",
    "reply": "/api/v2/conversations/{id}/replies",
    "wardrobe": "/api/v2/wardrobe/{user_id}/items",
    "item_upload": "/api/v2/item_upload/items/{id}",
    "item_create": "/api/v2/item_upload/items",
    "photo_upload": "/api/v2/photos",
    "item_delete": "/api/v2/items/{id}/delete",
    "item_hide": "/api/v2/items/{id}/is_hidden",
    "item_details": "/api/v2/items/{id}/details",
    "catalog": "/api/v2/catalog/items",
    "favourite_toggle": "/api/v2/user_favourites/toggle",
    "item_likers": "",           # inconnu : laisser vide => offres individuelles indisponibles
}

UI = {
    # Bouton natif « Envoyer une offre aux membres intéressés / qui ont ajouté en favori »
    "offer_likers_button": r"offre.*(favori|int[ée]ress)|(favori|int[ée]ress).*offre",
    "offer_price_input": 'input[name="price"], input[inputmode="decimal"], input[type="number"]',
    "offer_confirm_button": r"^(envoyer|confirmer|valider)",
    "captcha_frames": 'iframe[src*="captcha-delivery"], iframe[src*="geo.captcha"], iframe[title*="captcha" i]',
}

UPLOAD_KEYS_TO_COPY = [
    "title", "description", "brand_id", "brand", "size_id", "catalog_id", "status_id", "color_ids",
    "package_size_id", "is_unisex", "isbn", "measurement_length", "measurement_width",
    "item_attributes", "manufacturer", "manufacturer_labelling", "video_game_rating_id",
    "shipment_prices", "currency",
]


def _price(value: Any) -> float:
    if isinstance(value, dict):
        value = value.get("amount")
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def parse_item(d: dict, base_url: str = "https://www.vinted.fr") -> Item:
    photos = [p.get("full_size_url") or p.get("url") for p in (d.get("photos") or []) if isinstance(p, dict)]
    if not photos and isinstance(d.get("photo"), dict):
        photos = [d["photo"].get("full_size_url") or d["photo"].get("url")]
    created = d.get("created_at_ts")
    if not created:
        hr = (d.get("photo") or {}).get("high_resolution") or {}
        created = hr.get("timestamp")
    brand = d.get("brand_title") or (d.get("brand") if isinstance(d.get("brand"), str) else
                                    (d.get("brand") or {}).get("title", ""))
    url = d.get("url") or f"{base_url}/items/{d.get('id')}"
    if url.startswith("/"):
        url = base_url + url
    return Item(
        id=str(d.get("id")), title=d.get("title", ""), price=_price(d.get("price")),
        size=d.get("size_title") or d.get("size") or "", status=d.get("status") or "",
        brand=brand or "", favourites=int(d.get("favourite_count") or 0),
        views=int(d.get("view_count") or 0), created_ts=float(created) if created else None,
        url=url, photos=[p for p in photos if p], description=d.get("description") or "",
        is_closed=bool(d.get("is_closed")), is_reserved=bool(d.get("is_reserved")),
        is_hidden=bool(d.get("is_hidden")), raw=d,
    )


class VintedWebClient:
    def __init__(self, cfg: dict, guard: Guard):
        self.cfg = cfg
        self.guard = guard
        self.base = cfg["vinted"]["base_url"].rstrip("/")
        self.endpoints = {**ENDPOINTS, **(cfg["vinted"].get("endpoints") or {})}
        self._pw = None
        self._ctx = None
        self.page = None
        self._csrf: str | None = None
        self._blocked: tuple[int, str] | None = None
        self._user_id = str(cfg["vinted"]["user_id"]) if cfg["vinted"].get("user_id") else None

    # ------------------------------------------------------------------ navigateur
    def start(self) -> None:
        if self.page is not None:
            return
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:  # pragma: no cover
            raise SystemExit("Playwright n'est pas installé : pip install -r requirements.txt "
                             "puis python -m playwright install chromium") from exc
        v = self.cfg["vinted"]
        Path(v["profile_dir"]).mkdir(parents=True, exist_ok=True)
        self._pw = sync_playwright().start()
        self._ctx = self._pw.chromium.launch_persistent_context(
            v["profile_dir"], headless=bool(v["headless"]), locale=v["locale"],
            timezone_id=v["timezone"], viewport={"width": 1366, "height": 860},
            **({"executable_path": v["executable_path"]} if v.get("executable_path") else {}),
        )
        self.page = self._ctx.pages[0] if self._ctx.pages else self._ctx.new_page()
        self._ctx.on("response", self._on_response)
        self.goto("/")

    def close(self) -> None:
        try:
            if self._ctx:
                self._ctx.close()
            if self._pw:
                self._pw.stop()
        finally:
            self._ctx = self._pw = self.page = None

    def _on_response(self, response) -> None:
        try:
            if ("vinted." in response.url and response.status in (429, 403)
                    and response.request.resource_type in ("document", "xhr", "fetch")):
                self._blocked = (response.status, response.url)
        except Exception:
            pass

    def _check_blocked(self) -> None:
        if self._blocked:
            status, url = self._blocked
            self._blocked = None
            self.guard.halt(f"Réponse HTTP {status} de Vinted", url[:150])
        if self.page is None:
            return
        if "captcha" in self.page.url.lower() or self.page.locator(UI["captcha_frames"]).count() > 0:
            self.guard.halt("Captcha détecté", self.page.url)
        try:
            text = self.page.evaluate("() => (document.body && document.body.innerText || '').slice(0, 4000)")
        except Exception:
            text = ""
        hit = self.guard.check_page_text(text)
        if hit:
            self.guard.halt("Avertissement Vinted détecté sur la page", hit)

    def goto(self, path: str) -> None:
        self.guard.pace(f"page {path}")
        self.guard.count_read()
        url = path if path.startswith("http") else self.base + path
        self.page.goto(url, wait_until="domcontentloaded")
        self.page.wait_for_timeout(1500)
        self._csrf = None
        self._check_blocked()

    def wait_for_manual_login(self) -> str | None:
        """Ouvre Vinted et attend que tu te connectes toi-même."""
        self.start()
        print("\n👉 Connecte-toi à Vinted dans la fenêtre ouverte (captcha / code compris).")
        input("   Quand ta page d'accueil connectée s'affiche, appuie sur Entrée ici… ")
        self._user_id = None
        uid = self.current_user_id(required=False)
        return uid

    # ------------------------------------------------------------------ API interne
    def _csrf_token(self) -> str:
        if self._csrf:
            return self._csrf
        token = self.page.evaluate(
            """() => {
                const m = document.querySelector('meta[name="csrf-token"]');
                if (m) return m.content;
                const html = document.documentElement.innerHTML;
                const r = html.match(/CSRF_TOKEN\\\\?"\\s*:\\s*\\\\?"([0-9a-zA-Z-]{20,})/);
                return r ? r[1] : '';
            }"""
        )
        self._csrf = token or ""
        return self._csrf

    def _anon_id(self) -> str:
        for c in self._ctx.cookies(self.base):
            if c["name"] == "anon_id":
                return c["value"]
        return ""

    def _api(self, method: str, endpoint: str, params: dict | None = None, body: Any = None,
             write: bool = False, allow_404: bool = False, **fmt) -> dict:
        self.start()
        path = self.endpoints[endpoint]
        if not path:
            raise FeatureUnavailable(f"chemin d'API « {endpoint} » non configuré")
        url = self.base + path.format(**fmt)
        if params:
            url += "?" + urlencode(params)
        self.guard.pace(f"{method} {endpoint}")
        self.guard.count_read()
        headers = {"Accept": "application/json, text/plain, */*", "locale": "fr-FR"}
        if write:
            headers.update({"Content-Type": "application/json", "X-CSRF-Token": self._csrf_token(),
                            "X-Anon-Id": self._anon_id()})
        res = self.page.evaluate(
            """async ({url, method, headers, body}) => {
                const r = await fetch(url, {method, headers, credentials: 'include',
                                            body: body === null ? undefined : body});
                return {status: r.status, text: await r.text()};
            }""",
            {"url": url, "method": method, "headers": headers,
             "body": None if body is None else json.dumps(body)},
        )
        return self._handle(res, endpoint, allow_404)

    def _handle(self, res: dict, endpoint: str, allow_404: bool) -> dict:
        status = res["status"]
        if status in (429, 403):
            self.guard.halt(f"Réponse HTTP {status} de Vinted", endpoint)
        if status == 401:
            self.guard.halt("Session Vinted expirée", "relance `python main.py login`")
        if status == 404 and allow_404:
            return {"_status": 404}
        if status >= 400:
            raise RuntimeError(f"Vinted {endpoint} : HTTP {status} — {res['text'][:200]}")
        self._check_blocked()
        try:
            data = json.loads(res["text"] or "{}")
        except json.JSONDecodeError:
            raise RuntimeError(f"Réponse non JSON pour {endpoint} (le site a peut-être changé)")
        data["_status"] = status
        return data

    # ------------------------------------------------------------------ lecture
    def current_user_id(self, required: bool = True) -> str | None:
        if self._user_id:
            return self._user_id
        self.start()
        for c in self._ctx.cookies(self.base):
            if c["name"] == "v_uid" and c["value"]:
                self._user_id = c["value"]
                return self._user_id
        if required:
            raise SystemExit("Non connecté : lance `python main.py login` (ou renseigne vinted.user_id).")
        return None

    def list_inbox(self, limit: int) -> list[Conversation]:
        data = self._api("GET", "inbox", params={"page": 1, "per_page": min(limit, 50)})
        me = self.current_user_id()
        out = []
        for c in data.get("conversations", []):
            other = c.get("opposite_user") or {}
            out.append(Conversation(
                id=str(c.get("id")), other_user=other.get("login", ""), other_user_id=str(other.get("id", "")),
                unread=bool(c.get("unread")),
                last_message_mine=str((c.get("last_message") or {}).get("user_id", "")) == me,
                url=f"{self.base}/inbox/{c.get('id')}",
            ))
        return out[:limit]

    def get_conversation(self, conversation_id: str) -> Conversation:
        data = self._api("GET", "conversation", id=conversation_id).get("conversation", {})
        me = self.current_user_id()
        msgs = []
        for n, m in enumerate(data.get("messages", [])):
            if m.get("entity_type") != "message":
                continue  # offres, statuts de transaction… ignorés
            ent = m.get("entity") or {}
            author = str(ent.get("user_id", ""))
            mid = str(m.get("id") or ent.get("id") or f"{conversation_id}-{m.get('created_at_ts', n)}")
            msgs.append(Message(id=mid, body=ent.get("body", ""), author_id=author,
                                ts=m.get("created_at_ts"), is_mine=author == me))
        tx = data.get("transaction") or {}
        item_ids = [str(tx["item_id"])] if tx.get("item_id") else []
        item_ids += [str(i.get("id")) for i in data.get("items", []) or [] if i.get("id")]
        other = data.get("opposite_user") or {}
        return Conversation(id=str(conversation_id), other_user=other.get("login", ""),
                            other_user_id=str(other.get("id", "")), item_ids=list(dict.fromkeys(item_ids)),
                            messages=msgs, last_message_mine=bool(msgs and msgs[-1].is_mine),
                            url=f"{self.base}/inbox/{conversation_id}")

    def list_my_items(self) -> list[Item]:
        uid = self.current_user_id()
        items, page = [], 1
        while page <= 10:
            data = self._api("GET", "wardrobe", params={"page": page, "per_page": 96, "order": "relevance"},
                             user_id=uid)
            batch = data.get("items", [])
            items += [parse_item(d, self.base) for d in batch]
            pag = data.get("pagination") or {}
            if not batch or page >= int(pag.get("total_pages") or 1):
                break
            page += 1
        return items

    def get_item_upload_data(self, item_id: str) -> dict:
        return self._api("GET", "item_upload", id=item_id).get("item", {})

    def download_photos(self, item: Item, dest_dir: str) -> list[str]:
        Path(dest_dir).mkdir(parents=True, exist_ok=True)
        paths = []
        for n, url in enumerate(item.photos, 1):
            self.guard.pace("photo")
            self.guard.count_read()
            resp = self._ctx.request.get(url)
            if resp.status in (429, 403):
                self.guard.halt(f"Réponse HTTP {resp.status} (photo)", url[:120])
            if not resp.ok:
                raise RuntimeError(f"Photo {n} non téléchargée (HTTP {resp.status})")
            ext = ".png" if "png" in (resp.headers.get("content-type") or "") else ".jpg"
            p = Path(dest_dir) / f"photo_{n:02d}{ext}"
            p.write_bytes(resp.body())
            paths.append(str(p))
        return paths

    def search_catalog(self, keyword: str, page: int, per_page: int, order: str) -> list[Item]:
        data = self._api("GET", "catalog", params={"search_text": keyword, "page": page,
                                                   "per_page": per_page, "order": order})
        return [parse_item(d, self.base) for d in data.get("items", [])]

    def item_state(self, item_id: str) -> str:
        data = self._api("GET", "item_details", allow_404=True, id=item_id)
        if data.get("_status") == 404:
            return "gone"
        item = data.get("item") or data
        if item.get("is_closed") or item.get("is_sold"):
            return "sold"
        return "active"

    def list_item_likers(self, item_id: str) -> list[str]:
        data = self._api("GET", "item_likers", allow_404=True, id=item_id)
        users = data.get("users") or data.get("favourites") or []
        return [str(u.get("id") or u.get("user_id")) for u in users if isinstance(u, dict)]

    # ------------------------------------------------------------------ écriture
    def send_message(self, conversation_id: str, body: str) -> None:
        self._api("POST", "reply", write=True, id=conversation_id,
                  body={"reply": {"body": body, "photo_temp_uuids": None,
                                  "is_personal_data_sharing_check_skipped": False}})

    def _upload_photo(self, path: str) -> int:
        self.guard.pace("upload photo")
        self.guard.count_read()
        b64 = base64.b64encode(Path(path).read_bytes()).decode()
        res = self.page.evaluate(
            """async ({url, b64, uuid, csrf, anon}) => {
                const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                const fd = new FormData();
                fd.append('photo[type]', 'item');
                fd.append('photo[temp_uuid]', uuid);
                fd.append('photo[file]', new Blob([bin], {type: 'image/jpeg'}), 'photo.jpg');
                const r = await fetch(url, {method: 'POST', body: fd, credentials: 'include',
                                            headers: {'X-CSRF-Token': csrf, 'X-Anon-Id': anon}});
                return {status: r.status, text: await r.text()};
            }""",
            {"url": self.base + self.endpoints["photo_upload"], "b64": b64, "uuid": str(uuid.uuid4()),
             "csrf": self._csrf_token(), "anon": self._anon_id()},
        )
        return int(self._handle(res, "photo_upload", False)["id"])

    def create_item_copy(self, upload_data: dict, photo_paths: list[str]) -> str:
        if not photo_paths:
            raise RuntimeError("Aucune photo à republier : copie annulée.")
        photo_ids = [self._upload_photo(p) for p in photo_paths]
        item = {k: upload_data[k] for k in UPLOAD_KEYS_TO_COPY if k in upload_data}
        item["price"] = _price(upload_data.get("price"))
        item["id"] = None
        item["assigned_photos"] = [{"id": pid, "orientation": 0} for pid in photo_ids]
        data = self._api("POST", "item_create", write=True,
                         body={"item": item, "feedback_id": None, "parcel": None,
                               "upload_session_id": str(uuid.uuid4())})
        new_id = (data.get("item") or {}).get("id")
        if not new_id:
            raise RuntimeError("Vinted n'a pas renvoyé l'identifiant de la nouvelle annonce.")
        return str(new_id)

    def delete_item(self, item_id: str) -> None:
        self._api("POST", "item_delete", write=True, body={}, id=item_id)

    def hide_item(self, item_id: str) -> None:
        self._api("PUT", "item_hide", write=True, body={"is_hidden": True}, id=item_id)

    def offer_to_likers(self, item_id: str, price: float) -> int:
        self.goto(f"/items/{item_id}")
        button = self.page.get_by_role("button", name=re.compile(UI["offer_likers_button"], re.I))
        if button.count() == 0:
            button = self.page.get_by_role("link", name=re.compile(UI["offer_likers_button"], re.I))
        if button.count() == 0:
            raise FeatureUnavailable("bouton « offre aux membres intéressés » introuvable sur l'annonce")
        self.guard.pace("clic offre")
        button.first.click()
        field = self.page.locator(UI["offer_price_input"]).first
        field.wait_for(timeout=10_000)
        field.fill("")
        field.type(f"{price:.2f}".replace(".", ","), delay=120)
        self.guard.pace("confirmation offre")
        self.page.get_by_role("button", name=re.compile(UI["offer_confirm_button"], re.I)).last.click()
        self.page.wait_for_timeout(2500)
        self._check_blocked()
        return -1  # nombre de destinataires non communiqué par Vinted

    def send_individual_offer(self, item_id: str, user_id: str, price: float) -> None:
        raise FeatureUnavailable("offre individuelle à un membre non implémentée sur le site web")

    def favourite_item(self, item_id: str) -> None:
        self._api("POST", "favourite_toggle", write=True,
                  body={"type": "item", "user_favourites": [int(item_id)]})

    def prefill_new_listing(self, draft: dict) -> None:
        """Pré-remplit le formulaire de mise en vente. Ne clique JAMAIS sur « Publier »."""
        self.goto("/items/new")
        self.page.locator('input[type="file"]').first.set_input_files(draft["photos"][:20])
        self.page.wait_for_timeout(3000)
        for selector, value in [('input[name="title"], #title', draft["title"]),
                                ('textarea[name="description"], #description', draft["description"]),
                                ('input[name="price"], #price', "" if not draft.get("suggested_price")
                                 else f"{draft['suggested_price']:.2f}".replace(".", ","))]:
            field = self.page.locator(selector).first
            if value and field.count():
                self.guard.pace("saisie")
                field.fill(value)
        self._check_blocked()

    # ------------------------------------------------------------------ pages tierces (DHgate)
    def read_external_page(self, url: str, script: str) -> Any:
        """Ouvre une page non-Vinted dans un onglet séparé, en lecture seule, puis le ferme."""
        self.start()
        self.guard.pace("page externe")
        tab = self._ctx.new_page()
        try:
            resp = tab.goto(url, wait_until="domcontentloaded", timeout=45_000)
            if resp is not None and resp.status in (403, 429):
                raise FeatureUnavailable(f"site externe : HTTP {resp.status}")
            tab.wait_for_timeout(3000)
            return tab.evaluate(script)
        finally:
            tab.close()
            time.sleep(0.2)
