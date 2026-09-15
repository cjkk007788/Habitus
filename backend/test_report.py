import asyncio
from app.core.database import SessionLocal
from app.models.archive import Item, User

async def run():
    db = SessionLocal()
    user = db.query(User).first()
    items = db.query(Item).filter(Item.user_id == user.id).all()
    count = 0
    for item in items:
        media = item.media_meta if isinstance(item.media_meta, dict) else {}
        subtitle = getattr(item, 'subtitle', '')
        title = item.title
        if 'De La Soul' in str(title) or 'De La Soul' in str(subtitle) or 'De La Soul' in str(media):
            print(f"[{item.item_type}] {item.title}")
            print(f" - contributors: {media.get('contributors', [])}")

if __name__ == "__main__":
    asyncio.run(run())
    