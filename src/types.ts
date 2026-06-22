export interface SearchConfig {
  id: string;
  label: string;
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate: string;
  passengers: number;
  vehicle: {
    type: "motorcycle";
    label: string;
  };
  resident: boolean;
  targetSailings: {
    outboundTime: string;
    returnTime: string;
  };
}

export type ScrapeStatus = "success" | "sailing_not_found" | "error";

export interface ScrapeResult {
  searchId: string;
  label: string;
  status: ScrapeStatus;
  timestamp: string;
  outboundTime?: string;
  returnTime?: string;
  price?: string;
  currency?: string;
  message?: string;
  screenshotPath?: string;
}
