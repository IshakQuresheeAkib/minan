import { stitch } from "@google/stitch-sdk";

const PROJECT_ID = "13355773345746508246";
const SCREEN_ID = "2d52c1fcfe7a4ae0ae62e84bfef2369e";

const project = stitch.project(PROJECT_ID);
const screen = await project.getScreen(SCREEN_ID);

const htmlUrl = await screen.getHtml();
const imageUrl = await screen.getImage();

console.log("HTML_URL=" + htmlUrl);
console.log("IMAGE_URL=" + imageUrl);
