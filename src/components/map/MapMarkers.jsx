import { memo } from 'react'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { getOccupancyColor, getMarkerRadius, getParkingMetrics } from '../../utils/calculations'
import { normalizeStatus } from '../../utils/formatters'

function MapMarkersComponent({ parkings, selectedParking, onSelectParking }) {
  return (
    <>
      {parkings.map((parking) => {
        const color = getOccupancyColor(parking)
        const isSelected = selectedParking?.id === parking.id
        const metrics = getParkingMetrics(parking)

        return (
          <CircleMarker
            key={parking.id}
            center={[parking.lat, parking.lng]}
            radius={isSelected ? getMarkerRadius(parking) + 3 : getMarkerRadius(parking)}
            eventHandlers={{
              click: () => onSelectParking(parking),
            }}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: isSelected ? 4 : 2,
            }}
          >
            <Popup>
              <strong>{parking.name}</strong>
              <br />
              Status: {normalizeStatus(parking.status)}
              <br />
              {metrics.freeLabel}
              <br />
              {metrics.totalLabel}
              <br />
              {metrics.occupancyLabel}
              {parking.openingHours ? (
                <>
                  <br />
                  <small>Öffnungszeiten: {parking.openingHours}</small>
                </>
              ) : null}
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}

export const MapMarkers = memo(MapMarkersComponent)
