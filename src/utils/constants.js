// Default configuration constants
export const DEFAULT_CENTER = [48.7758, 9.1829] // Stuttgart Hauptbahnhof
export const DEFAULT_RADIUS_KM = 5
export const DEFAULT_REFRESH_SECONDS = 60
export const REFRESH_OPTIONS = [60, 120, 300, 600, 900]

// Map Themes Configuration
export const MAP_THEMES = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; OpenStreetMap contributors',
  },

  osmDE: {
    id: 'osmDE',
    name: 'OpenStreetMap DE',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution:
      '&copy; OpenStreetMap contributors',
  },

  cartoLight: {
    id: 'cartoLight',
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
  },

  cartoDark: {
    id: 'cartoDark',
    name: 'Carto Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
  },

  voyager: {
    id: 'voyager',
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
  },

  positron: {
    id: 'positron',
    name: 'Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
  },

  darkMatter: {
    id: 'darkMatter',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO',
  },



  esriWorldImagery: {
    id: 'esriWorldImagery',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri',
  },

  esriTopo: {
    id: 'esriTopo',
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri',
  },

  openTopoMap: {
    id: 'openTopoMap',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; OpenStreetMap contributors, SRTM',
  },
}

export const DEFAULT_THEME = 'osm'
