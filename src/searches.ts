import type { SearchConfig } from "./types";

export const SEARCHES: SearchConfig[] = [
  {
    id: "search-1",
    label: "Alcudia-Ciutadella 05-06 Sep 2026",
    origin: "Alcúdia",
    destination: "Ciutadella",
    outboundDate: "05/09/2026",
    returnDate: "06/09/2026",
    passengers: 2,
    vehicle: {
      type: "motorcycle",
      label: "Motocicleta más de 50cc",
    },
    resident: true,
    targetSailings: {
      outboundTime: "08:30",
      returnTime: "20:00",
    },
  },
  {
    id: "search-2",
    label: "Alcudia-Ciutadella 12-13 Sep 2026",
    origin: "Alcúdia",
    destination: "Ciutadella",
    outboundDate: "12/09/2026",
    returnDate: "13/09/2026",
    passengers: 2,
    vehicle: {
      type: "motorcycle",
      label: "Motocicleta más de 50cc",
    },
    resident: true,
    targetSailings: {
      outboundTime: "08:30",
      returnTime: "20:00",
    },
  },
  // TODO: remove slice
].slice(0, 1);
