import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../context/AppContext'

// US State coordinates (approximate centers)
const STATE_COORDS = {
  AL: [32.806671, -86.791130],
  AK: [61.370716, -152.404419],
  AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123],
  CA: [36.116203, -119.681564],
  CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371],
  DE: [39.318523, -75.507141],
  FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643074],
  HI: [21.094318, -157.498337],
  ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137],
  IN: [39.849426, -86.258278],
  IA: [42.011539, -93.210526],
  KS: [38.526600, -96.726486],
  KY: [37.668140, -84.670067],
  LA: [31.169546, -91.867805],
  ME: [44.693947, -69.381927],
  MD: [39.063946, -76.802101],
  MA: [42.230171, -71.530106],
  MI: [43.326618, -84.536095],
  MN: [45.694454, -93.900192],
  MS: [32.741646, -89.678696],
  MO: [38.456085, -92.288368],
  MT: [46.921925, -110.454353],
  NE: [41.125370, -98.268082],
  NV: [38.313515, -117.055374],
  NH: [43.452492, -71.563896],
  NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482],
  NY: [42.165726, -74.948051],
  NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012],
  OH: [40.388783, -82.764915],
  OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938],
  PA: [40.590752, -77.209755],
  RI: [41.680893, -71.511780],
  SC: [33.856892, -80.945007],
  SD: [44.299782, -99.438828],
  TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461],
  UT: [40.150032, -111.862434],
  VT: [44.045876, -72.710686],
  VA: [37.769337, -78.169968],
  WA: [47.400902, -121.490494],
  WV: [38.491226, -80.954453],
  WI: [44.268543, -89.616508],
  WY: [42.755966, -107.302490],
  DC: [38.897438, -77.026817]
}

export function LeadsHeatmap() {
  const { leads } = useApp()

  // Aggregate leads by state
  const stateData = useMemo(() => {
    const counts = {}
    let maxCount = 0

    leads.forEach(lead => {
      if (lead.state) {
        const state = lead.state.toUpperCase()
        counts[state] = (counts[state] || 0) + 1
        maxCount = Math.max(maxCount, counts[state])
      }
    })

    return { counts, maxCount }
  }, [leads])

  // Get color based on count
  const getColor = (count, maxCount) => {
    if (maxCount === 0) return '#6B7280'
    const intensity = count / maxCount
    if (intensity > 0.7) return '#E85D5D' // Hot red
    if (intensity > 0.4) return '#F5A623' // Warm orange
    return '#C9A962' // Gold
  }

  // Get radius based on count
  const getRadius = (count, maxCount) => {
    if (maxCount === 0) return 10
    const base = 10
    const scale = (count / maxCount) * 25
    return base + scale
  }

  const statesWithLeads = Object.entries(stateData.counts).map(([state, count]) => ({
    state,
    count,
    coords: STATE_COORDS[state]
  })).filter(s => s.coords)

  // Calculate total leads with location
  const totalWithLocation = statesWithLeads.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3 className="heatmap-title">Lead Distribution Map</h3>
        <div className="heatmap-stats">
          <span>{totalWithLocation} leads mapped</span>
          <span>{Object.keys(stateData.counts).length} states</span>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="heatmap-empty">
          <p>No leads yet. Add leads to see geographic distribution.</p>
        </div>
      ) : (
        <>
          <div className="heatmap-map">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {statesWithLeads.map(({ state, count, coords }) => (
                <CircleMarker
                  key={state}
                  center={coords}
                  radius={getRadius(count, stateData.maxCount)}
                  fillColor={getColor(count, stateData.maxCount)}
                  fillOpacity={0.7}
                  stroke={true}
                  color="#1B2A4A"
                  weight={2}
                >
                  <Tooltip>
                    <strong>{state}</strong>: {count} lead{count !== 1 ? 's' : ''}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="heatmap-legend">
            <span className="legend-title">Density:</span>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#C9A962' }}></span>
              <span>Low</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#F5A623' }}></span>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#E85D5D' }}></span>
              <span>High</span>
            </div>
          </div>

          {statesWithLeads.length > 0 && (
            <div className="heatmap-ranking">
              <h4>Top States</h4>
              <div className="ranking-list">
                {statesWithLeads
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.state} className="ranking-item">
                      <span className="ranking-position">#{index + 1}</span>
                      <span className="ranking-name">{item.state}</span>
                      <span className="ranking-count">{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
