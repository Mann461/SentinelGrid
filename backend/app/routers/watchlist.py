from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import WatchlistEntry
from app.schemas import WatchlistCreate, WatchlistOut
from app.auth import get_current_user, UserContext

router = APIRouter(prefix="/watchlist", tags=["Watchlist Management"])

@router.post(
    "", 
    response_model=WatchlistOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Add Watchlist Entry",
    description="Adds a new vehicle license plate or person face embedding reference to the target watchlist (stolen_vehicle, wanted_person, missing_person, blacklisted_vehicle, suspect, or other)."
)
async def create_watchlist_entry(
    entry_in: WatchlistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user)
):
    """
    Registers a watchlist target across all 5 named categories + extensible 'other'.
    """
    entry = WatchlistEntry(
        category=entry_in.category,
        identifier=entry_in.identifier.upper().strip(),
        description=entry_in.description,
        source_authority=entry_in.source_authority or f"{current_user.department} HQ",
        active=entry_in.active
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

@router.get(
    "", 
    response_model=List[WatchlistOut],
    summary="List Watchlist Entries",
    description="Retrieves active watchlist entries filterable by category."
)
async def get_watchlist_entries(
    category: Optional[str] = Query(None, description="Filter category (stolen_vehicle, wanted_person, missing_person, blacklisted_vehicle, suspect, other)"),
    active_only: bool = Query(True, description="Filter only active watchlist entries"),
    db: AsyncSession = Depends(get_db)
):
    """
    Query active watchlist entries.
    """
    stmt = select(WatchlistEntry)
    if category and category != "ALL":
        stmt = stmt.where(WatchlistEntry.category == category)
    if active_only:
        stmt = stmt.where(WatchlistEntry.active == True)

    stmt = stmt.order_by(WatchlistEntry.date_added.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
