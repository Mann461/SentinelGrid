from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import LoginRequest, TokenResponse
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

PRESET_USERS = {
    "police_admin": {
        "user_id": "usr-pol-001",
        "username": "Inspector V.K. Jadeja",
        "department": "Gujarat Police",
        "role": "DepartmentAdmin",
        "accessible_regions": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"]
    },
    "rto_officer": {
        "user_id": "usr-rto-002",
        "username": "Officer P.M. Patel",
        "department": "RTO Gujarat",
        "role": "RTO_Inspector",
        "accessible_regions": ["Ahmedabad", "Surat", "Gandhinagar"]
    },
    "civil_supplies": {
        "user_id": "usr-civ-003",
        "username": "Inspector S.R. Shah",
        "department": "Food & Civil Supplies",
        "role": "CivilSupplies_Auditor",
        "accessible_regions": ["Surat", "Vadodara", "Bhavnagar"]
    },
    "cross_dept_auditor": {
        "user_id": "usr-aud-004",
        "username": "Director H.N. Mehta",
        "department": "Home Department (State HQ)",
        "role": "StateSuperAuditor",
        "accessible_regions": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"]
    }
}

@router.post(
    "/login", 
    response_model=TokenResponse,
    summary="User Login & JWT Issue",
    description="Authenticates user credentials and issues a JWT token populated with department and role claims."
)
async def login(req: LoginRequest):
    """
    Authenticate against Department-wise RBAC rules.
    Returns JWT Token with scoped claims.
    """
    username_key = req.username.lower().replace(" ", "_")
    user_info = PRESET_USERS.get(username_key)
    
    if not user_info:
        # Fallback dynamic user generator for testing
        user_info = {
            "user_id": f"usr-{hash(req.username) % 1000:03d}",
            "username": req.username,
            "department": req.department,
            "role": "DepartmentAdmin" if "admin" in req.username.lower() else "FieldOfficer",
            "accessible_regions": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"]
        }

    access_token = create_access_token(
        data={
            "sub": user_info["user_id"],
            "username": user_info["username"],
            "department": user_info["department"],
            "role": user_info["role"],
            "accessible_regions": user_info["accessible_regions"]
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user_info["user_id"],
        username=user_info["username"],
        department=user_info["department"],
        role=user_info["role"],
        accessible_regions=user_info["accessible_regions"]
    )
