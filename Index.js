// Intégration du style
require("./index.css").toString();

/**
 * Outil pour créer un bloc de type iframe PDF
 */
class AlignBlocks {
  /**
   * Bouton pour ajouter un bloc "Pdf"
   */
  static get toolbox() {
    return {
      title: "AlignBlocks",
      icon: require("./assets/image-svgrepo-com.svg").default,
    };
  }

  constructor({ data, api }) {
    this.api = api;
    this._data = {};
    this.data = data;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    //Faire en sorte d'actualiser la data
  }

  /**
   * Rendu dans l'éditeur lorsqu'on ajoute ce type de bloc
   * @returns {HTMLElement} Bloc au format HTML
   */

  render() {
    const blockId = this.api.blocks.getCurrentBlockIndex();
    this.wrapper = document.createElement("div");
    this.wrapper.classList.value = "row";
    this.wrapper.id = "ligne" + blockId;
    //Création du premier bloc
    let col1 = document.createElement("div");
    col1.classList.value = "col";
    let bloc1 = document.createElement("div");
    bloc1.id = `_bloc1_ligne${blockId}`;
    bloc1.style = "border: solid grey 0.10rem;";
    bloc1.classList.value = "ce-paragraph cdx-block";
    bloc1.contentEditable = "true";
    bloc1.addEventListener("paste", (event) => {
      this._createImage(event, bloc1.id);
    });
    col1.appendChild(bloc1);
    $(`#_bloc1_ligne${blockId}`).attr("data-placeholder");

    this.wrapper.appendChild(col1);

    return this.wrapper;
  }

  // setTune(id_bloc, id_ligne) {
  //   let imgSrc,
  //     imgWidth,
  //     imgStyle = "";
  //   if (id_ligne != "") {
  //     if (document.getElementById(id_ligne).childNodes != undefined) {
  //       for (let elementFirst of document.getElementById(id_ligne).childNodes) {
  //         for (let element of elementFirst.childNodes) {
  //           if (element.tagName == "IMG") {
  //             imgSrc = element.src;
  //             imgWidth = element.width;
  //             imgStyle = element.style;
  //           }
  //           if (element.id != "") {
  //             this._data[element.id] = {
  //               Data: {
  //                 BlocId: element.id,
  //                 Texte: element.innerText,
  //                 BlocStyle: element.style,
  //               },
  //               Img:
  //                 imgSrc != undefined
  //                   ? {
  //                       ImgSrc: imgSrc,
  //                       ImgWidth: `${imgWidth}`,
  //                       ImgStyle: imgStyle,
  //                     }
  //                   : { ImgSrc: "", ImgWidth: "", ImgStyle: "" },
  //             };
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  setTune(id_bloc, id_ligne) {
    let imgSrc,
      imgWidth,
      imgStyle = "";
    for (let elementSecond of document.getElementById(`${id_ligne}`)
      .childNodes) {
      for (let element of elementSecond.childNodes) {
        if (document.getElementById(element.id).childNodes[0] != undefined) {
          if (
            document.getElementById(element.id).childNodes[0].tagName == "IMG"
          ) {
            imgSrc = document.getElementById(element.id).childNodes[0].src;
            imgWidth = document.getElementById(element.id).childNodes[0].width;
            imgStyle = document.getElementById(element.id).childNodes[0].style;
          } else {
            imgSrc = "";
            imgWidth = "";
            imgStyle = "";
          }
        } else {
          imgSrc = "";
          imgWidth = "";
          imgStyle = "";
        }

        this._data[element.id] = {
          Data: {
            BlocId: element.id,
            Texte: element.innerText,
            BlocStyle: element.style,
          },
          Img:
            imgSrc != undefined
              ? {
                  ImgSrc: imgSrc,
                  ImgWidth: `${imgWidth}`,
                  ImgStyle: imgStyle,
                }
              : { ImgSrc: "", ImgWidth: "", ImgStyle: "" },
        };
      }
    }
  }

  _createImage(url, id_bloc) {
    //Taille du wrapper inférieur à 4 et on insère une url
    const blockId = this.api.blocks.getCurrentBlockIndex();
    if (url.clipboardData.getData("text").includes("https://")) {
      if (document.getElementById(`ligne${blockId}`).childNodes.length < 4) {
        //On va créer et ajouter un nouveau bloc s'il n'existe pas
        // if (document.getElementById(`_bloc${id_bloc + 1}`) == undefined) {
        let idNext =
          document.getElementById(`ligne${blockId}`).childNodes.length + 1;
        let col = document.createElement("div");
        col.classList.value = "col";
        let bloc = document.createElement("div");
        bloc.id = `_bloc${idNext}_ligne${blockId}`;
        bloc.style = "border: solid grey 0.10rem;";
        bloc.classList.value = "ce-paragraph cdx-block";
        bloc.contentEditable = "true";
        bloc.addEventListener("paste", (event) => {
          this._createImage(event, bloc.id);
        });
        col.appendChild(bloc);
        $(`#_bloc${idNext}_ligne${blockId}`).attr("data-placeholder");
        document.getElementById(`ligne${blockId}`).appendChild(col);
        // }
      }

      const image = document.createElement("img");
      image.src = url.clipboardData.getData("text");
      image.style = "max-width: 75%;";
      let urlCurrentTarget = url.currentTarget;
      urlCurrentTarget.appendChild(image);

      let base64 = "";
      toDataUrl(image.src, function (myBase64) {
        base64 = myBase64; // myBase64 is the base64 string
        ajaxPost(
          "/documentation/cilt_edit/noticeEditorUploadImageByUrl",
          { imageBase64: base64 },
          (reponse) => {
            rep = JSON.parse(reponse);
            let toto = image.src;
            image.src = rep.url;
            supprime(urlCurrentTarget, toto);
          }
        );
      });
    }
  }

  /**
   * Fonction pour mettre en forme les données lors de la sauvegarde des blocs
   * @param {HTMLElement} blockContent
   * @returns
   */

  save() {
    const blockId = this.api.blocks.getCurrentBlockIndex();
    this.setTune("r", `ligne${blockId}`);
    return this._data;
  }
  renderSettings() {
    const settings = [
      {
        name: "addBlock",
        icon: require("./assets/add-block-svgrepo-com.svg").default,
        title: "Ajouter un nouveau bloc",
      },
      {
        name: "seeGrid",
        icon: require("./assets/view-grid-svgrepo-com.svg").default,
        title: "Afficher/Masquer les grilles",
      },
    ];
    const blockId = this.api.blocks.getCurrentBlockIndex();
    const wrapper = document.createElement("div");

    settings.forEach((tune) => {
      let button = document.createElement("div");
      button.id = `_tune_${tune.name}`;
      if (tune.name === "seeGrid") {
        document.getElementById(`ligne${blockId}`).childNodes[0].childNodes[0]
          .style.border == "0.1rem solid grey"
          ? (button.classList.value =
              "cdx-settings-button cdx-settings-button--active")
          : (button.classList.value = "cdx-settings-button");
      } else {
        button.classList.add("cdx-settings-button");
      }

      button.innerHTML = tune.icon;
      wrapper.appendChild(button);

      if (tune.name == "addBlock") {
        button.addEventListener("click", () => {
          this._toggleTune(tune.name);
          //La ligne suivante va passer le bouton cliquer en actif
          // button.classList.toggle("cdx-settings-button--active");

          //Ajout de la fonction permettant d'ajouter un nouveau bloc
          this._addBlock(`ligne${blockId}`);
        });
      }
      if (tune.name == "seeGrid") {
        button.addEventListener("click", (event) => {
          this._toggleTune(tune.name);
          this._seeGrid(`ligne${blockId}`);
          //La ligne suivante va passer le bouton cliquer en actif
          if (
            document.getElementById(`ligne${blockId}`).childNodes[0]
              .childNodes[0].style.border == "0.1rem solid grey"
          ) {
            button.classList.value =
              "cdx-settings-button cdx-settings-button--active";
          } else {
            button.classList.value = "cdx-settings-button";
          }

          //Ajout de la fonction permettant d'ajouter un nouveau bloc
        });
      }
    });

    return wrapper;
  }

  _addBlock(id_ligne) {
    if (document.getElementById(id_ligne).childNodes.length < 4) {
      let idNext = document.getElementById(id_ligne).childNodes.length + 1;
      let col = document.createElement("div");
      col.classList.value = "col";
      let bloc = document.createElement("div");
      bloc.id = `_bloc${idNext}_${id_ligne}`;
      bloc.style = "border: solid grey 0.10rem;";
      bloc.classList.value = "ce-paragraph cdx-block";
      bloc.contentEditable = "true";
      bloc.addEventListener("paste", (event) => {
        this._createImage(event, bloc.id);
      });
      col.appendChild(bloc);
      $(`#_bloc${idNext}_${id_ligne}`).attr("data-placeholder");
      document.getElementById(id_ligne).appendChild(col);
    }
  }

  _seeGrid(id_ligne) {
    for (let element of document.getElementById(id_ligne).childNodes) {
      for (let childElement of element.childNodes) {
        if (
          document.querySelector("#_tune_seeGrid").classList.value ==
          "cdx-settings-button cdx-settings-button--active"
        ) {
          childElement.style.border = "";
        } else {
          childElement.style.border = "0.1rem solid grey";
        }
      }
    }
  }

  _toggleTune(tune) {
    // this.data[tune] = !this.data[tune];
    // this._acceptTuneView();
    console.log("Vous avez cliqué sur : ", tune);
  }
  _acceptTuneView() {
    this.settings.forEach((tune) => {
      this.wrapper.classList.toggle(tune.name, !!this.data[tune.name]);
    });
  }
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

//fonction permettant de convertir une url en base64 pour permettre d'enregistrer l'image dans la bdd
function toDataUrl(url, callback) {
  let xhr = new XMLHttpRequest();
  xhr.onload = function () {
    let reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.send();
}

//fonction permettant de supprimer l'url du bloc après avoir charger l'image
function supprime(target, mot) {
  target.innerHTML = target.innerHTML.replace(mot, "");
}

module.exports = AlignBlocks;
