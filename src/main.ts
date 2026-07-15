import { Plugin } from "obsidian";

export default class HetiPlugin extends Plugin {
  async onload() {
    console.log("Heti 插件已加载");
  }
  onunload() {
    console.log("Heti 插件已卸载");
  }
}
