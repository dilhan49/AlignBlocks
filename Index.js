// Intégration du style
require("./index.css").toString();

/**
 * Outil pour créer un bloc d'alignement permettant de comporter jusqu'à 5 blocs
 */
class AlignBlocks {
  /**
   * Bouton pour ajouter un bloc "AlignBlock"
   */
  static get toolbox() {
    return {
      title: "AlignBlocks",
      icon: require("./assets/image-svgrepo-com.svg").default,
    };
  }

  constructor({ data, api }) {
    this.api = api; //API editorJS; permet l'utilisation des fonctions de editorjs
    this._data = {};
    this.data = data;
  }

  get data() {
    return this._data;
  }

  set data(data) {}

  /**
   * Rendu dans l'éditeur lorsqu'on ajoute ce type de bloc
   * @returns {HTMLElement} Bloc au format HTML
   */

  render() {
    const blockId = this.api.blocks.getCurrentBlockIndex();
    this.wrapper = document.createElement("div");
    this.wrapper.classList.value = "row";
    this.wrapper.id = "ligne" + blockId;
    // On instancie notre bloc alignblocks à laquelle on ajout une div.row
    //Lorsqu'on ajout un bloc (max.4), il s'agit d'un ajout d'une div.col à la div.row créé plus haut

    //Création du premier bloc
    let col1 = document.createElement("div");
    col1.classList.value = "col";
    let bloc1 = document.createElement("div");
    bloc1.id = `_bloc1_ligne${blockId}`; //id du bloc
    bloc1.style = "border: solid grey 0.10rem;";
    bloc1.classList.value = "ce-paragraph cdx-block container"; // norme des blocs editorjs
    bloc1.contentEditable = "true"; //Bloc editable
    bloc1.addEventListener("paste", (event) => {
      this._createImage(event, bloc1.id); //Lorsqu'on colle un objet dans le bloc, on traite cet objet dans la méthode _createImage
    });

    //sélecteur de fichier pour charger image
    //On ajout un sélecteur de fichier de type input pour pouvoir charger des images dans le bloc directement depuis un explorateur de fichiers
    let selFile = document.createElement("input");
    selFile.type = "file";
    selFile.id = `_selFile_bloc1_ligne${blockId}`;
    selFile.accept = "image/png, image/jpeg";
    selFile.display = "none";
    selFile.addEventListener("change", () => {
      let fichier = selFile.files[0];
      let name =
        selFile.files[0].name != undefined
          ? selFile.files[0].name
          : "image.png";
      let reader = new FileReader();
      reader.addEventListener("load", function () {
        let donnees = reader.result; // conversion du fichier en base64
        data = { image: donnees.split("base64,")[1], name: name };
        //Enregistrement du fichier dans le dossier des images notices
        ajaxPost(
          "/documentation/cilt_edit/noticeEditorUploadImageByFile",
          data,
          (reponse) => {
            rep = JSON.parse(reponse);
            console.log(rep);
            selFile.remove(); //on supprime le sélecteur de fichier après utilisation
            iconeInputFile.remove(); // idem (iconeInputFile est une icone remplaçant visuellement l'input de type file)
            const image = document.createElement("img");
            image.src = rep.file.url; //on remplace la source de l'image créé par le chemin d'accès de l'image ajouté dans le dossier des images notices
            //Création d'un bouton superposé sur l'image qui permet d'augmenter la taille de l'image
            let btnIncrease = document.createElement("img");
            btnIncrease.classList.value = "btn";
            btnIncrease.src =
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png";
            //on cache le bouton par défaut
            btnIncrease.hidden = true;
            btnIncrease.addEventListener(
              "click",
              () => {
                image.width = image.width * 1.1;
              },
              false
            );
            //lorsque la souris est dessus le bloc, on affiche le bouton créé plus tôt ce qui nous permet de cliquer dessus afin d'augmenter sa taille
            bloc1.addEventListener("mouseover", () => {
              btnIncrease.hidden = false;
            });
            //lorsque la souris n'est pas dessus le bloc, on masque le bouton et ses fonctionnalités
            bloc1.addEventListener("mouseout", () => {
              btnIncrease.hidden = true;
            });

            //Idem que btnIncrease mais qui sert ici à réduire la taille de l'image
            let btnReduce = document.createElement("img");
            btnReduce.classList.value = "btn";
            btnReduce.src =
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png";
            btnReduce.style = "left: 35%;";
            btnReduce.hidden = true;
            btnReduce.addEventListener(
              "click",
              () => {
                image.width = image.width * 0.9;
              },
              false
            );
            bloc1.addEventListener("mouseover", () => {
              btnReduce.hidden = false;
            });
            bloc1.addEventListener("mouseout", () => {
              btnReduce.hidden = true;
            });

            bloc1.appendChild(image);
            bloc1.appendChild(btnIncrease);
            bloc1.appendChild(btnReduce);
          }
        );
      });
      reader.readAsDataURL(fichier);
    });
    //Création d'un petit icone explicite pour remplacer visuellement l'input de type file
    let iconeInputFile = document.createElement("img");
    iconeInputFile.src =
      "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png";
    iconeInputFile.addEventListener("click", function () {
      selFile.click();
    });
    iconeInputFile.id = `_icon_selFile_${bloc1.id}`;
    bloc1.appendChild(iconeInputFile);
    //on a ajouté le selecteur de fichier
    col1.appendChild(bloc1);
    $(`#_bloc1_ligne${blockId}`).attr("data-placeholder");

    this.wrapper.appendChild(col1);

    return this.wrapper;
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
        bloc.classList.value = "ce-paragraph cdx-block container";
        bloc.contentEditable = "true";
        bloc.addEventListener("paste", (event) => {
          this._createImage(event, bloc.id);
        });

        //sélecteur de fichier pour charger image
        let selFile = document.createElement("input");
        selFile.type = "file";
        selFile.id = `_selFile_${bloc.id}`;
        selFile.accept = "image/png, image/jpeg";
        selFile.display = "none";
        selFile.addEventListener("change", () => {
          let fichier = selFile.files[0];
          let name =
            selFile.files[0].name != undefined
              ? selFile.files[0].name
              : "image.png";
          let reader = new FileReader();
          reader.addEventListener("load", function () {
            let donnees = reader.result;
            data = { image: donnees.split("base64,")[1], name: name };
            ajaxPost(
              "/documentation/cilt_edit/noticeEditorUploadImageByFile",
              data,
              (reponse) => {
                rep = JSON.parse(reponse);
                console.log(rep);
                selFile.remove();
                iconeInputFile.remove();
                const image = document.createElement("img");
                image.src = rep.file.url;
                let btnIncrease = document.createElement("img");
                btnIncrease.classList.value = "btn";
                btnIncrease.src =
                  "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png";
                btnIncrease.hidden = true;
                btnIncrease.addEventListener(
                  "click",
                  () => {
                    image.width = image.width * 1.1;
                  },
                  false
                );
                bloc.addEventListener("mouseover", () => {
                  btnIncrease.hidden = false;
                });
                bloc.addEventListener("mouseout", () => {
                  btnIncrease.hidden = true;
                });

                let btnReduce = document.createElement("img");
                btnReduce.classList.value = "btn";
                btnReduce.src =
                  "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png";
                btnReduce.style = "left: 35%;";
                btnReduce.hidden = true;
                btnReduce.addEventListener(
                  "click",
                  () => {
                    image.width = image.width * 0.9;
                  },
                  false
                );
                bloc.addEventListener("mouseover", () => {
                  btnReduce.hidden = false;
                });
                bloc.addEventListener("mouseout", () => {
                  btnReduce.hidden = true;
                });
                bloc.appendChild(image);
                bloc.appendChild(btnIncrease);
                bloc.appendChild(btnReduce);
              }
            );
          });
          reader.readAsDataURL(fichier);
        });
        let iconeInputFile = document.createElement("img");
        iconeInputFile.src =
          "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png";
        iconeInputFile.addEventListener("click", function () {
          selFile.click();
        });
        iconeInputFile.id = `_icon_selFile_${bloc.id}`;
        bloc.appendChild(iconeInputFile);

        col.appendChild(bloc);
        $(`#_bloc${idNext}_ligne${blockId}`).attr("data-placeholder");
        document.getElementById(`ligne${blockId}`).appendChild(col);
        // }
      }

      const image = document.createElement("img");
      image.src = url.clipboardData.getData("text");
      let urlCurrentTarget = url.currentTarget;
      let btnIncrease = document.createElement("img");
      btnIncrease.classList.value = "btn";
      btnIncrease.src =
        "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png";
      btnIncrease.hidden = true;
      btnIncrease.addEventListener(
        "click",
        () => {
          image.width = image.width * 1.1;
        },
        false
      );
      urlCurrentTarget.addEventListener("mouseover", () => {
        btnIncrease.hidden = false;
      });
      urlCurrentTarget.addEventListener("mouseout", () => {
        btnIncrease.hidden = true;
      });

      let btnReduce = document.createElement("img");
      btnReduce.classList.value = "btn";
      btnReduce.src =
        "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png";
      btnReduce.style = "left: 35%;";
      btnReduce.hidden = true;
      btnReduce.addEventListener(
        "click",
        () => {
          image.width = image.width * 0.9;
        },
        false
      );
      urlCurrentTarget.addEventListener("mouseover", () => {
        btnReduce.hidden = false;
      });
      urlCurrentTarget.addEventListener("mouseout", () => {
        btnReduce.hidden = true;
      });
      urlCurrentTarget.appendChild(btnReduce);
      urlCurrentTarget.appendChild(btnIncrease);

      urlCurrentTarget.appendChild(image);
      for (let element of urlCurrentTarget.childNodes) {
        if (
          element.tagName == "IMG" &&
          element.src ==
            "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png"
        ) {
          element.remove();
        }
      }
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
    } else if (url.clipboardData.files.length > 0) {
      //Lorsqu'on colle une image
      let fichier = url.clipboardData.files[0];
      let name = url.clipboardData.files[0].name;
      let reader = new FileReader();
      let idNext =
        document.getElementById(`ligne${blockId}`).childNodes.length + 1;
      let col = document.createElement("div");
      col.classList.value = "col";

      const image = document.createElement("img");
      image.src = "";
      let urlCurrentTarget = url.currentTarget;
      for (let element of urlCurrentTarget.childNodes) {
        if (
          element.tagName == "IMG" &&
          element.src ==
            "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png"
        ) {
          element.remove();
        }
      }
      reader.addEventListener("load", function () {
        var donnees = reader.result;
        data = {
          image: donnees.split("base64,")[1],
          name: name,
        };
        ajaxPost(
          "/documentation/cilt_edit/noticeEditorUploadImageByFile",
          data,
          function (reponse) {
            rep = JSON.parse(reponse);
            console.log(rep);
            const image = document.createElement("img");
            image.src = rep.file.url;
            let btnIncrease = document.createElement("img");
            btnIncrease.classList.value = "btn";
            btnIncrease.src =
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png";
            btnIncrease.hidden = true;
            btnIncrease.addEventListener(
              "click",
              () => {
                image.width = image.width * 1.1;
              },
              false
            );
            urlCurrentTarget.addEventListener("mouseover", () => {
              btnIncrease.hidden = false;
            });
            urlCurrentTarget.addEventListener("mouseout", () => {
              btnIncrease.hidden = true;
            });

            let btnReduce = document.createElement("img");
            btnReduce.classList.value = "btn";
            btnReduce.src =
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png";
            btnReduce.style = "left: 35%;";
            btnReduce.hidden = true;
            btnReduce.addEventListener(
              "click",
              () => {
                image.width = image.width * 0.9;
              },
              false
            );
            urlCurrentTarget.addEventListener("mouseover", () => {
              btnReduce.hidden = false;
            });
            urlCurrentTarget.addEventListener("mouseout", () => {
              btnReduce.hidden = true;
            });
            urlCurrentTarget.appendChild(image);
            urlCurrentTarget.appendChild(btnIncrease);
            urlCurrentTarget.appendChild(btnReduce);
          }
        );
      });
      reader.readAsDataURL(fichier);
    }
  }

  /**
   * Méthode pour mettre en forme les données lors de la sauvegarde des blocs
   * @param {HTMLElement} blockContent
   * @returns
   */

  save(blockContent) {
    let imgSrc,
      imgWidth,
      imgStyle = "";
    let listBlock = [];
    let textBlock = "";
    for (let elementSecond of blockContent.childNodes) {
      textBlock = "";
      for (let element of elementSecond.childNodes) {
        textBlock = element.innerHTML
          .replace("Augmenter la taille de l'image", "")
          .replace("Diminuer la taille de l'image", "");
        if (document.getElementById(element.id).childNodes[0] != undefined) {
          document.getElementById(element.id).childNodes.forEach((toto) => {
            if (
              toto.tagName == "IMG" &&
              toto.src !=
                "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png" &&
              toto.src !=
                "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png" &&
              toto.src !=
                "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png"
            ) {
              if (toto.src.includes("EditorJSImageTemporaire")) {
                imgSrc = toto.src.replace(
                  "EditorJSImageTemporaire",
                  "EditorJSImageFinal"
                );
              } else {
                imgSrc = toto.src;
              }

              imgWidth = toto.width;
              imgStyle = toto.style;
              textBlock = textBlock.replace(`${toto.outerHTML}`, "");
            } else if (
              toto.src ==
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png"
            ) {
              imgSrc = "";
              imgWidth = "";
              imgStyle = "";
            }
          });
        } else {
          imgSrc = "";
          imgWidth = "";
          imgStyle = "";
        }

        listBlock.push({
          Data: {
            BlocId: element.id,
            TexteHTML: textBlock,
            BlocStyle: element.style,
            AjustementAuto:
              element.parentNode.classList == "col" ? false : true,
          },
          Img:
            imgSrc != undefined
              ? {
                  ImgSrc: imgSrc,
                  ImgWidth: `${imgWidth}`,
                  ImgStyle: imgStyle,
                }
              : { ImgSrc: "", ImgWidth: "", ImgStyle: "" },
        });
      }
    }
    return listBlock;
  }
  renderSettings() {
    const settings = [
      {
        name: "addBlock",
        icon: require("./assets/add-block-svgrepo-com.svg").default,
        title: "Ajouter un nouveau bloc",
      },
      {
        name: "deleteBlock",
        icon: require("./assets/backspace-svgrepo-com.svg").default,
        title: "Supprimer le dernier bloc",
      },
      {
        name: "seeGrid",
        icon: require("./assets/view-grid-svgrepo-com.svg").default,
        title: "Afficher/Masquer les grilles",
      },
      {
        name: "increasePicturesSize",
        icon: require("./assets/expand-svgrepo-com.svg").default,
        title: "Augmenter la taille des images",
      },
      {
        name: "reducePicturesSize",
        icon: require("./assets/reduce-svgrepo-com.svg").default,
        title: "Diminuer la taille des images",
      },
      {
        name: "colAuto",
        icon: require("./assets/adjustment.svg").default,
        title: "Ajustement automatique",
      },
    ];
    const blockId = this.api.blocks.getCurrentBlockIndex();
    const wrapper = document.createElement("div");

    settings.forEach((tune) => {
      let button = document.createElement("div");
      button.id = `_tune_${tune.name}`;
      button.title = tune.title;
      //on ajout un id au bouton seeGrid pour gérer si on doit passer le bouton en actif ou non
      if (tune.name === "seeGrid") {
        document.getElementById(`ligne${blockId}`).childNodes[0].childNodes[0]
          .style.border == "0.1rem solid grey"
          ? (button.classList.value =
              "cdx-settings-button cdx-settings-button--active")
          : (button.classList.value = "cdx-settings-button");
      } else if (tune.name === "colAuto") {
        document.getElementById(`ligne${blockId}`).childNodes[0].classList ==
        "col-auto"
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
          //Ajout de la Méthode permettant d'ajouter un nouveau bloc
          this._addBlock(`ligne${blockId}`);
        });
      }
      if (tune.name == "deleteBlock") {
        button.addEventListener("click", () => {
          this._toggleTune(tune.name);
          //Ajout de la Méthode permettant d'ajouter un nouveau bloc
          this._deleteBlock(`ligne${blockId}`);
        });
      }
      if (tune.name == "increasePicturesSize") {
        button.addEventListener("click", () => {
          this._toggleTune(tune.name);
          //Ajout de la Méthode permettant d'ajouter un nouveau bloc
          this._increasePicturesSize(`ligne${blockId}`);
        });
      }
      if (tune.name == "reducePicturesSize") {
        button.addEventListener("click", () => {
          this._toggleTune(tune.name);
          //Ajout de la Méthode permettant d'ajouter un nouveau bloc
          this._reducePicturesSize(`ligne${blockId}`);
        });
      }
      if (tune.name == "colAuto") {
        button.addEventListener("click", () => {
          this._toggleTune(tune.name);
          //Ajout de la Méthode permettant d'ajouter un nouveau bloc
          this._colAuto(`ligne${blockId}`);
          //La ligne suivante va passer le bouton cliquer en actif
          if (
            document.getElementById(`ligne${blockId}`).childNodes[0]
              .classList == "col-auto"
          ) {
            button.classList.value =
              "cdx-settings-button cdx-settings-button--active";
          } else {
            button.classList.value = "cdx-settings-button";
          }
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
        });
      }
    });

    return wrapper;
  }
  _reducePicturesSize(id_ligne) {
    for (let elementFirst of document.getElementById(id_ligne).childNodes) {
      for (let element of elementFirst.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
          if (
            element.childNodes[i].tagName == "IMG" &&
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png" && // Il s'agit de la source de l'icone
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png" &&
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png" &&
            element.childNodes[i].width > 100
          ) {
            element.childNodes[i].width = element.childNodes[i].width * 0.9;
          }
        }
      }
    }
  }

  _increasePicturesSize(id_ligne) {
    for (let elementFirst of document.getElementById(id_ligne).childNodes) {
      for (let element of elementFirst.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
          if (
            element.childNodes[i].tagName == "IMG" &&
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png" && // Il s'agit de la source de l'icone
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png" &&
            element.childNodes[i].src !=
              "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png"
          ) {
            element.childNodes[i].width = element.childNodes[i].width * 1.1;
          }
        }
      }
    }
  }

  _addBlock(id_ligne) {
    if (document.getElementById(id_ligne).childNodes.length < 4) {
      let idNext = document.getElementById(id_ligne).childNodes.length + 1;
      let col = document.createElement("div");
      col.classList.value = "col";
      let bloc = document.createElement("div");
      bloc.id = `_bloc${idNext}_${id_ligne}`;
      bloc.style = "border: solid grey 0.10rem;";
      bloc.classList.value = "ce-paragraph cdx-block container";
      bloc.contentEditable = "true";
      bloc.addEventListener("paste", (event) => {
        this._createImage(event, bloc.id);
      });

      //sélecteur de fichier pour charger image
      let selFile = document.createElement("input");
      selFile.type = "file";
      selFile.id = `_selFile_${bloc.id}`;
      selFile.accept = "image/png, image/jpeg";
      selFile.display = "none";
      selFile.addEventListener("change", () => {
        let fichier = selFile.files[0];
        let name =
          selFile.files[0].name != undefined
            ? selFile.files[0].name
            : "image.png";
        let reader = new FileReader();
        reader.addEventListener("load", function () {
          let donnees = reader.result;
          data = { image: donnees.split("base64,")[1], name: name };
          ajaxPost(
            "/documentation/cilt_edit/noticeEditorUploadImageByFile",
            data,
            (reponse) => {
              rep = JSON.parse(reponse);
              console.log(rep);
              selFile.remove();
              iconeInputFile.remove();
              const image = document.createElement("img");
              image.src = rep.file.url;
              //Création d'un bouton superposé sur l'image qui permet d'augmenter la taille de l'image
              let btnIncrease = document.createElement("img");
              btnIncrease.classList.value = "btn";
              btnIncrease.src =
                "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25390.png";
              //on cache le bouton par défaut
              btnIncrease.hidden = true;
              btnIncrease.addEventListener(
                "click",
                () => {
                  image.width = image.width * 1.1;
                },
                false
              );
              //lorsque la souris est dessus le bloc, on affiche le bouton créé plus tôt ce qui nous permet de cliquer dessus afin d'augmenter sa taille
              bloc.addEventListener("mouseover", () => {
                btnIncrease.hidden = false;
              });
              //lorsque la souris n'est pas dessus le bloc, on masque le bouton et ses fonctionnalités
              bloc.addEventListener("mouseout", () => {
                btnIncrease.hidden = true;
              });

              //Idem que btnIncrease mais qui sert ici à réduire la taille de l'image
              let btnReduce = document.createElement("img");
              btnReduce.classList.value = "btn";
              btnReduce.src =
                "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/25387.png";
              btnReduce.style = "left: 35%;";
              btnReduce.hidden = true;
              btnReduce.addEventListener(
                "click",
                () => {
                  image.width = image.width * 0.9;
                },
                false
              );
              bloc.addEventListener("mouseover", () => {
                btnReduce.hidden = false;
              });
              bloc.addEventListener("mouseout", () => {
                btnReduce.hidden = true;
              });

              bloc.appendChild(image);
              bloc.appendChild(btnIncrease);
              bloc.appendChild(btnReduce);
            }
          );
        });
        reader.readAsDataURL(fichier);
      });
      let iconeInputFile = document.createElement("img");
      iconeInputFile.src =
        "https://slslt00254.sidom.sidel.com/static/editorjs-tools/alignblocks/src/assets/pictureButton.png";
      iconeInputFile.addEventListener("click", function () {
        selFile.click();
      });
      iconeInputFile.id = `_icon_selFile_${bloc.id}`;
      bloc.appendChild(iconeInputFile);

      col.appendChild(bloc);
      $(`#_bloc${idNext}_${id_ligne}`).attr("data-placeholder");
      document.getElementById(id_ligne).appendChild(col);
    }
  }
  _deleteBlock(id_ligne) {
    if (
      document.getElementById(id_ligne).childNodes.length <= 4 &&
      document.getElementById(id_ligne).childNodes.length > 1
    ) {
      let tailleLigne = document.getElementById(id_ligne).childNodes.length;
      document.getElementById(id_ligne).childNodes[tailleLigne - 1].remove();
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
          for (let i = 1; i <= 4; i++) {
            if (
              document.getElementById(`_icon_selFile__bloc${i}_${id_ligne}`) !=
              undefined
            ) {
              document.getElementById(
                `_icon_selFile__bloc${i}_${id_ligne}`
              ).hidden = true;
            }
          }
        } else {
          childElement.style.border = "0.1rem solid grey";
          for (let i = 1; i <= 4; i++) {
            if (
              document.getElementById(`_icon_selFile__bloc${i}_${id_ligne}`) !=
              undefined
            ) {
              document.getElementById(
                `_icon_selFile__bloc${i}_${id_ligne}`
              ).hidden = false;
            }
          }
        }
      }
    }
  }

  _toggleTune(tune) {
    //Méthode loggant dans la console le nom de l'outil cliqué
    console.log("Vous avez cliqué sur : ", tune);
  }
  _colAuto(id_ligne) {
    const firstChild =
      document.getElementById(id_ligne).childNodes[0].classList;
    for (
      let i = 0;
      i < document.getElementById(id_ligne).childNodes.length;
      i++
    ) {
      if (i == 0) {
        if (
          document.getElementById(id_ligne).childNodes[i].classList == "col"
        ) {
          document.getElementById(id_ligne).childNodes[i].classList =
            "col-auto";
        } else {
          document.getElementById(id_ligne).childNodes[i].classList = "col";
        }
      } else if (i > 0) {
        if (
          document.getElementById(id_ligne).childNodes[0].classList == "col"
        ) {
          document.getElementById(id_ligne).childNodes[i].classList = "col";
        } else {
          document.getElementById(id_ligne).childNodes[i].classList =
            "col-auto";
        }
      }
    }
  }
} //On sort de la classe

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
