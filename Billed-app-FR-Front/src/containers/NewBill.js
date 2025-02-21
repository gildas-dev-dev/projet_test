import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

// verification regex
const checkFileExtension = function (e, filname) {
  let allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
  if (!allowedExtensions.test(filname)) {
    let erreur = "Seule les fichiers .jpg, .png .jepg sont autorisées";
    document.querySelector(".msgError").textContent = erreur;
    e.target.value = "";
    return false;
  } else return true;
};

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    // ajout de specification au fichier
    const fileType = document.querySelector(`input[data-testid="file"]`);
    fileType.setAttribute("accept", "image/png,image/jpg,image/jpeg");
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    // tache effectuée
    const fileType = document.querySelector(`input[data-testid="file"]`);
    fileType.setAttribute("accept", "image/png,image/jpg,image/jpeg");

    console.log(fileType);
    const filePath = e.target.value.split(/\\/g);
    console.log(filePath);
    const fileName = filePath[filePath.length - 1];
    console.log(fileName);
    const formData = new FormData();

    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    // verification
    if (checkFileExtension(e, file.name)) {
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })

        .then(({ fileUrl, key }) => {
          console.log(fileUrl);
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          
          this.onNavigate(ROUTES_PATH["Bills"]); 
        })
        .catch((error) => console.error(error));
    }
  };
}
