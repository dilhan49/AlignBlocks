/**
 * Image Tool for the Editor.js
 *
 * @author CodeX <team@codex.so>
 * @license MIT
 * @see {@link https://github.com/editor-js/image}
 *
 * To developers.
 * To simplify Tool structure, we split it to 4 parts:
 *  1) index.js — main Tool's interface, public API and methods for working with data
 *  2) uploader.js — module that has methods for sending files via AJAX: from device, by URL or File pasting
 *  3) ui.js — module for UI manipulations: render, showing preloader, etc
 *  4) tunes.js — working with Block Tunes: render buttons, handle clicks
 *
 * For debug purposes there is a testing server
 * that can save uploaded files and return a Response {@link UploadResponseFormat}
 *
 *       $ node dev/server.js
 *
 * It will expose 8008 port, so you can pass http://localhost:8008 with the Tools config:
 *
 * image: {
 *   class: ImageTool,
 *   config: {
 *     endpoints: {
 *       byFile: 'http://localhost:8008/uploadFile',
 *       byUrl: 'http://localhost:8008/fetchUrl',
 *     }
 *   },
 * },
 */

/**
 * @typedef {object} ImageToolData
 * @description Image Tool's input and output data format
 * @property {string} caption — image caption
 * @property {boolean} withBorder - should image be rendered with border
 * @property {boolean} withBackground - should image be rendered with background
 * @property {boolean} stretched - should image be stretched to full width of container
 * @property {object} file — Image file data returned from backend
 * @property {string} file.url — image URL
 */

// eslint-disable-next-line
import css from "./index.css";
import Ui from "./ui";
import Tunes from "./tunes";
import ToolboxIcon from "./svg/toolbox.svg";
import Uploader from "./uploader";

/**
 * @typedef {object} ImageConfig
 * @description Config supported by Tool
 * @property {object} endpoints - upload endpoints
 * @property {string} endpoints.byFile - upload by file
 * @property {string} endpoints.byUrl - upload by URL
 * @property {string} field - field name for uploaded image
 * @property {string} types - available mime-types
 * @property {string} captionPlaceholder - placeholder for Caption field
 * @property {object} additionalRequestData - any data to send with requests
 * @property {object} additionalRequestHeaders - allows to pass custom headers with Request
 * @property {string} buttonContent - overrides for Select File button
 * @property {object} [uploader] - optional custom uploader
 * @property {function(File): Promise.<UploadResponseFormat>} [uploader.uploadByFile] - method that upload image by File
 * @property {function(string): Promise.<UploadResponseFormat>} [uploader.uploadByUrl] - method that upload image by URL
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] image source URL
 */
export default class ImageTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: ToolboxIcon,
      title: "Image",
    };
  }

  /**
   * @param {object} tool - tool properties got from editor.js
   * @param {ImageToolData} tool.data - previously saved data
   * @param {ImageConfig} tool.config - user config for Tool
   * @param {object} tool.api - Editor.js API
   * @param {boolean} tool.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config.endpoints || "",
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || "image",
      types: config.types || "image/*",
      captionPlaceholder: this.api.i18n.t(
        config.captionPlaceholder || "Caption"
      ),
      buttonContent: config.buttonContent || "",
      uploader: config.uploader || undefined,
      actions: config.actions || [],
    };

    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error),
    });

    /**
     * Module for working with UI
     */
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src) => {
            this.ui.showPreloader(src);
          },
        });
      },
      readOnly,
    });

    /**
     * Module for working with tunes
     */
    this.tunes = new Tunes({
      api,
      actions: this.config.actions,
      onChange: (tuneName) => this.tuneToggled(tuneName),
    });

    /**
     * Set saved state
     */
    this._data = {};
    this.data = data;
  }

  /**
   * Renders Block content
   *
   * @public
   *
   * @returns {HTMLDivElement}
   */
  render() {
    return this.ui.render(this.data);
  }

  /**
   * Validate data: check if Image exists
   *
   * @param {ImageToolData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    return savedData.file && savedData.file.url;
  }

  /**
   * Return Block data
   *
   * @public
   *
   * @returns {ImageToolData}
   */
  save() {
    const caption = this.ui.nodes.caption;

    this._data.caption = caption.innerHTML;
    if (this._data.imgAlign == undefined) {
      this.setTune("imgAlign", "left");
    }
    if (
      document.getElementById(`textArea${this._data.block_id}`) != undefined
    ) {
      this.setTune(
        "Text",
        document.getElementById(`textArea${this._data.block_id}`).value
      );
      this.setTune(
        "TextAreaWidth",
        document.getElementById(`textArea${this._data.block_id}`).style.width
      );
    }

    return this.data;
  }

  /**
   * Makes buttons with tunes: add background, add border, stretch image
   *
   * @public
   *
   * @returns {Element}
   */
  renderSettings() {
    return this.tunes.render(this.data);
  }

  /**
   * Fires after clicks on the Toolbox Image Icon
   * Initiates click on the Select File button
   *
   * @public
   */
  appendCallback() {
    this.ui.nodes.fileButton.click();
  }

  /**
   * Specify paste substitutes
   *
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @returns {{tags: string[], patterns: object<string, RegExp>, files: {extensions: string[], mimeTypes: string[]}}}
   */
  static get pasteConfig() {
    return {
      /**
       * Paste HTML into Editor
       */
      tags: ["img"],

      /**
       * Paste URL of image into the Editor
       */
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png)$/i,
      },

      /**
       * Drag n drop file from into the Editor
       */
      files: {
        mimeTypes: ["image/*"],
      },
    };
  }

  /**
   * Specify paste handlers
   *
   * @public
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @param {CustomEvent} event - editor.js custom paste event
   *                              {@link https://github.com/codex-team/editor.js/blob/master/types/tools/paste-events.d.ts}
   * @returns {void}
   */
  async onPaste(event) {
    switch (event.type) {
      case "tag": {
        const image = event.detail.data;

        /** Images from PDF */
        if (/^blob:/.test(image.src)) {
          const response = await fetch(image.src);
          const file = await response.blob();

          this.uploadFile(file);
          break;
        }

        this.uploadUrl(image.src);
        break;
      }
      case "pattern": {
        const url = event.detail.data;

        this.uploadUrl(url);
        break;
      }
      case "file": {
        const file = event.detail.file;

        this.uploadFile(file);
        break;
      }
    }
  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Stores all Tool's data
   *
   * @private
   *
   * @param {ImageToolData} data - data in Image Tool format
   */
  set data(data) {
    this.image = data.file;

    this._data.caption = data.caption || "";
    this.ui.fillCaption(this._data.caption);

    Tunes.tunes.forEach(({ name: tune }) => {
      if (tune !== "imgWidth" && tune !== "ReduceSize") {
        const value =
          typeof data[tune] !== "undefined"
            ? data[tune] === true || data[tune] === "true"
            : false;

        this.setTune(tune, value);
      } else {
        if (tune === "IncreaseSize" || tune === "ReduceSize") {
          const value =
            typeof data[tune] !== "undefined"
              ? data[tune] === true || data[tune] === "true"
              : false;

          this.setTune(tune, value);
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (tune === "IncreaseSize") {
            if (
              document.querySelector(
                `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                  blockId + 1
                }) > div > div > div.image-tool__image > img`
              ) != null
            ) {
              let widthImage = document.querySelector(
                `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                  blockId + 1
                }) > div > div > div.image-tool__image > img`
              ).width;
              const value =
                typeof data[tune] !== "undefined" ? widthImage : false;

              this.setTune("imgWidth", value);
            } else {
              this.setTune("imgWidth", 0);
            }
          }
          // if (tune === "TextArea") {
          //   if (data[tune] === true) {
          //     this.setTune(
          //       "TextArea",
          //       document.getElementById(`textArea${blockId - 1}`).value
          //     );
          //   }
          // }
        }
      }
    });
  }

  /**
   * Return Tool data
   *
   * @private
   *
   * @returns {ImageToolData}
   */
  get data() {
    delete this._data.IncreaseSize;
    delete this._data.ReduceSize;
    delete this._data.LeftAlign;
    delete this._data.CenterAlign;
    delete this._data.RightAlign;
    return this._data;
  }

  /**
   * Set new image file
   *
   * @private
   *
   * @param {object} file - uploaded file data
   */
  set image(file) {
    this._data.file = file || {};

    if (file && file.url) {
      this.ui.fillImage(file.url);
    }
  }

  /**
   * File uploading callback
   *
   * @private
   *
   * @param {UploadResponseFormat} response - uploading server response
   * @returns {void}
   */
  onUpload(response) {
    if (response.success && response.file) {
      this.image = response.file;
    } else {
      this.uploadingFailed("incorrect response: " + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   *
   * @private
   * @param {string} errorText - uploading error text
   * @returns {void}
   */
  uploadingFailed(errorText) {
    console.log("Image Tool: uploading failed because of", errorText);

    this.api.notifier.show({
      message: this.api.i18n.t("Couldn’t upload image. Please try another."),
      style: "error",
    });
    this.ui.hidePreloader();
  }

  /**
   * Callback fired when Block Tune is activated
   *
   * @private
   *
   * @param {string} tuneName - tune that has been clicked
   * @returns {void}
   */
  tuneToggled(tuneName) {
    // inverse tune state
    this.setTune(tuneName, !this._data[tuneName]);
  }

  /**
   * Set one tune
   *
   * @param {string} tuneName - {@link Tunes.tunes}
   * @param {boolean} value - tune state
   * @returns {void}
   */
  setTune(tuneName, value) {
    this._data[tuneName] = value;

    this.ui.applyTune(tuneName, value);

    if (tuneName === "stretched") {
      /**
       * Wait until the API is ready
       */
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();

          this.api.blocks.stretchBlock(blockId, value);
          console.log(this.api.blocks);
        })
        .catch((err) => {
          console.error(err);
        });
    }

    if (tuneName === "ReduceSize") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ) != null
          ) {
            let widthImage = document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ).width;
            // this.api.blocks.stretchBlock(blockId, value);
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ).width = widthImage / 2;
            const value =
              typeof this._data["imgWidth"] !== "undefined"
                ? widthImage
                : false;
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(4)"
            ).classList = "cdx-settings-button image-tool__tune";
            this.setTune("imgWidth", value);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "IncreaseSize") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ) != null
          ) {
            let widthImage = document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ).width;
            // this.api.blocks.stretchBlock(blockId, value);
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ).width = widthImage * 2;
            const value =
              typeof this._data["imgWidth"] !== "undefined"
                ? widthImage
                : false;
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(5)"
            ).classList = "cdx-settings-button image-tool__tune";
            this.setTune("imgWidth", value);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "HideCaption") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.cdx-input.image-tool__caption`
            ) != null
          ) {
            if (this._data[tuneName] == true) {
              document.querySelector(
                `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                  blockId + 1
                }) > div > div > div.cdx-input.image-tool__caption`
              ).hidden = true;
            } else if (this._data[tuneName] == false) {
              document.querySelector(
                `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                  blockId + 1
                }) > div > div > div.cdx-input.image-tool__caption`
              ).hidden = false;
            }
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "LeftAlign") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ) != null
          ) {
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image`
            ).align = "left";
            // this.setTune("LeftAlign", true);
            // this.setTune("RightAlign", false);
            // this.setTune("CenterAlign", false);
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(8)"
            ).classList = "cdx-settings-button image-tool__tune";
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(9)"
            ).classList = "cdx-settings-button image-tool__tune";
            this.setTune("imgAlign", "left");
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(7)"
            ).classList =
              "cdx-settings-button image-tool__tune cdx-settings-button--active";
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "CenterAlign") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ) != null
          ) {
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image`
            ).align = "center";
            // this.setTune("LeftAlign", false);
            // this.setTune("RightAlign", false);
            // this.setTune("CenterAlign", true);
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(7)"
            ).classList = "cdx-settings-button image-tool__tune";
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(9)"
            ).classList = "cdx-settings-button image-tool__tune";
            this.setTune("imgAlign", "center");
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(8)"
            ).classList =
              "cdx-settings-button image-tool__tune cdx-settings-button--active";
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "RightAlign") {
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();
          if (
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image > img`
            ) != null
          ) {
            document.querySelector(
              `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                blockId + 1
              }) > div > div > div.image-tool__image`
            ).align = "right";
            // this.setTune("LeftAlign", false);
            // this.setTune("CenterAlign", false);
            // this.setTune("RightAlign", true);
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(7)"
            ).classList = "cdx-settings-button image-tool__tune";
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(8)"
            ).classList = "cdx-settings-button image-tool__tune";
            this.setTune("imgAlign", "right");
            document.querySelector(
              "#editorJS > div > div.ce-toolbar.ce-toolbar--opened > div > div > div:nth-child(4) > div > div.ce-popover.ce-popover--opened > div.ce-popover__custom-content > div > div:nth-child(9)"
            ).classList =
              "cdx-settings-button image-tool__tune cdx-settings-button--active";
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (tuneName === "TextArea") {
      const blockId = this.api.blocks.getCurrentBlockIndex();
      this._data["block_id"] = blockId;
      if (this._data.TextArea == true) {
        Promise.resolve()
          .then(() => {
            //Si le bouton TextArea est cliqué, alors on va ajouter notre textarea ou seulement retirer le hidden s'il a déjà été ajouté
            if (
              document.querySelector(
                `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                  blockId + 1
                }) > div > div `
              ) != null
            ) {
              if (
                !document
                  .querySelector(
                    `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                      blockId + 1
                    }) > div > div `
                  )
                  .classList.contains("row")
              ) {
                document.querySelector(
                  `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                    blockId + 1
                  }) > div > div `
                ).classList += " row";
                document.querySelector(
                  `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                    blockId + 1
                  }) > div > div > div.image-tool__image`
                ).classList += " col";
                let textArea = document.createElement("textarea");
                textArea.class = "form-control col";
                textArea.id = `textArea${blockId}`;
                textArea.rows = "10";
                textArea.cols = "50";
                textArea.addEventListener(
                  "onkeyup",
                  function () {
                    this.setTune(
                      "toto",
                      document.getElementById(`textArea${blockId}`).value
                    );
                  },
                  false
                );

                textArea.style = "resize : both;";
                document
                  .querySelector(
                    `#editorJS > div > div.codex-editor__redactor > div:nth-child(${
                      blockId + 1
                    }) > div > div `
                  )
                  .appendChild(textArea);
              } else {
                document.getElementById(`textArea${blockId}`).hidden = false;
              }
            }
          })
          .catch((err) => {
            console.error(err);
          });
      } else if (
        this._data.TextArea == false &&
        document.getElementById(`textArea${blockId}`) != undefined
      ) {
        document.getElementById(`textArea${blockId}`).hidden = true;
      }
    }
  }

  /**
   * Show preloader and upload image file
   *
   * @param {File} file - file that is currently uploading (from paste)
   * @returns {void}
   */
  uploadFile(file) {
    this.uploader.uploadByFile(file, {
      onPreview: (src) => {
        this.ui.showPreloader(src);
      },
    });
  }

  /**
   * Show preloader and upload image by target url
   *
   * @param {string} url - url pasted
   * @returns {void}
   */
  uploadUrl(url) {
    this.ui.showPreloader(url);
    this.uploader.uploadByUrl(url);
  }
}
