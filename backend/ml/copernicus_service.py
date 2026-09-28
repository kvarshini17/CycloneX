"""
CycloneX Copernicus Marine SST Service
Product: METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2
Variable: analysed_sst
"""

import os
import time
import datetime
import traceback

_cache = {}
CACHE_TTL_SECONDS = 3600  # 1 hour in-memory cache

def get_sst(lat: float = 16.9, lon: float = 83.6):
    global _cache
    cache_key = f"{round(lat, 1)}_{round(lon, 1)}"
    now = time.time()
    
    if cache_key in _cache:
        cached_entry = _cache[cache_key]
        if now - cached_entry["_cached_at"] < CACHE_TTL_SECONDS:
            res = dict(cached_entry)
            res.pop("_cached_at", None)
            return res

    username = os.environ.get("COPERNICUSMARINE_SERVICE_USERNAME")
    password = os.environ.get("COPERNICUSMARINE_SERVICE_PASSWORD")
    
    if not username or not password:
        return {
            "source": "Copernicus Marine (METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2)",
            "value": None,
            "unit": "°C",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "latitude": lat,
            "longitude": lon,
            "status": "OFFLINE",
            "message": "Copernicus credentials not configured on backend"
        }

    try:
        import copernicusmarine

        # Login / ensure credentials
        try:
            copernicusmarine.login(username=username, password=password, force_overwrite=False)
        except Exception as login_err:
            print(f"[Copernicus] Login notice/retry: {login_err}")

        # Spatial subset around cyclone coordinates (+/- 0.5 degrees)
        min_lon = round(lon - 0.5, 2)
        max_lon = round(lon + 0.5, 2)
        min_lat = round(lat - 0.5, 2)
        max_lat = round(lat + 0.5, 2)

        ds = copernicusmarine.open_dataset(
            dataset_id="METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2",
            variables=["analysed_sst"],
            minimum_longitude=min_lon,
            maximum_longitude=max_lon,
            minimum_latitude=min_lat,
            maximum_latitude=max_lat,
        )

        latest_sst_da = ds["analysed_sst"].isel(time=-1)
        mean_kelvin = float(latest_sst_da.mean().values)
        celsius = round(mean_kelvin - 273.15, 2)
        timestamp_str = str(latest_sst_da.time.values)

        result = {
            "source": "Copernicus Marine",
            "product": "METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2",
            "variable": "analysed_sst",
            "value": celsius,
            "unit": "°C",
            "timestamp": timestamp_str,
            "latitude": lat,
            "longitude": lon,
            "status": "LIVE",
            "_cached_at": now
        }
        _cache[cache_key] = result
        
        user_res = dict(result)
        user_res.pop("_cached_at", None)
        return user_res

    except Exception as e:
        print(f"[Copernicus] Query error: {e}")
        traceback.print_exc()
        return {
            "source": "Copernicus Marine",
            "value": None,
            "unit": "°C",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "latitude": lat,
            "longitude": lon,
            "status": "FALLBACK",
            "error": str(e)
        }
