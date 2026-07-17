import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { ScView, SC_VIEW_TYPE } from "./sc-view";

export default class HetiPlugin extends Plugin {
  async onload() {
    this.registerView(SC_VIEW_TYPE, (leaf) => new ScView(leaf));

    this.registerExtensions(["sc"], SC_VIEW_TYPE);

    this.addCommand({
      id: "new-poem",
      name: "\u65b0\u5efa\u8bd7\u8bcd",
      callback: () => this.createNewPoem(),
    });
  }

  async createNewPoem() {
    const folderPath = "\u8bd7\u8bcd";
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
    const baseName = `${folderPath}/\u65b0\u5efa\u8bd7\u8bcd`;
    let filePath = `${baseName}.sc`;
    let counter = 1;
    while (await this.app.vault.adapter.exists(filePath)) {
      filePath = `${baseName} ${counter}.sc`;
      counter++;
    }
    const jsonData = JSON.stringify(
      {
        title: "",
        hetiType: "poetry",
        dynasty: "",
        author: "",
        font: "",
        fontSize: 0,
        charGap: 0,
        lines: [{ chars: [] }],
      },
      null,
      2
    );
    const file = await this.app.vault.create(filePath, jsonData);
    await this.openScFile(file);
  }

  async openScFile(file: TFile) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: SC_VIEW_TYPE,
      state: { file: file.path },
    });
  }

  onunload() {}
}
