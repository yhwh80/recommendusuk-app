import { httpRouter } from "convex/server";
import { auth } from "./auth";

// Wires up the Convex Auth HTTP routes (sign-in, token refresh, etc.).
const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
