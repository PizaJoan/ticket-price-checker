export const SELECTORS = {
  cookieAccept: [
    "#onetrust-accept-btn-handler",
    'span:has-text("Rechazar")',
    'span:has-text("Aceptar")',
  ],
  port: {
    placeholder: "Busca puerto o ciudad",
    dropdownTrigger: [
      '#sel-route-origin',
      '#route_destination_click'
    ]
  },
  searchForm: {
    datesTrigger: 'div.g-calendar',
    passengersTrigger: [
      'button:has-text("Pasajero")',
      'button:has-text("Pasajeros")',
      '[class*="searcher"] :text("Pasajero")',
    ],
    vehiclesTrigger: [
      'button:has-text("Añadir vehículo")',
      'button:has-text("vehículo")',
      'button:has-text("Vehículo")',
      '[class*="searcher"] :text("vehículo")',
    ],
    searchButton: [
      'button:has-text("Buscar")',
      'a:has-text("Buscar")',
    ],
    calendarNext: 'button.button-next-month',
    calendarConfirm: [
      'button:has-text("Confirmar")',
      'button:has-text("Aplicar")',
      'button:has-text("Listo")',
    ],
  },
  resident: [
    '[role="tab"]:has-text("Residente")',
    'button:has-text("Residente")',
    'label:has-text("Residente")',
    'text=Residente',
  ],
  vehicle: {
    motorcycle: [
      'button:has-text("Motocicleta")',
      'label:has-text("Motocicleta")',
      'text=Motocicleta',
    ],
    over50cc: [
      'button:has-text("más de 50")',
      'label:has-text("más de 50")',
      'text=más de 50cc',
      'text=+ de 50',
    ],
  },
  price: [
    '[class*="total"]',
    '[class*="price"]',
    '[data-testid*="total"]',
  ],
} as const;
