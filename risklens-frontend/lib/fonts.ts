import { Inter, Instrument_Serif, IM_Fell_English } from "next/font/google";

// Sans for UI and big titles, a serif for italic accents, and an old-print
// face for notebook-style captions and annotations.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--ff-serif" });
export const fell = IM_Fell_English({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--ff-fell" });
