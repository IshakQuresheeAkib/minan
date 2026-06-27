import { stitch } from "@google/stitch-sdk";

const PROJECT_ID = "13355773345746508246";
const SCREEN_ID = "cb5f564524b14658a970694ce45725cc";

const project = stitch.project(PROJECT_ID);
const screen = await project.getScreen(SCREEN_ID);

const htmlUrl = await screen.getHtml();
const imageUrl = await screen.getImage();

console.log("HTML_URL=" + htmlUrl);
console.log("IMAGE_URL=" + imageUrl);
