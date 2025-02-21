/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

// Ce test permet de verifier si le justificatif choisi correspond bien à un fichier qui a pour extension jpeg, png, jpg
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Ce test s'assure que lorsqu'un fichier avec une extension valide (jpg, jpeg, png) 
    // est téléchargé, le comportement attendu est correctement exécuté
    test("Then I upload a file with valid extension (jpg, jpeg, png)", () => {

      // **Préparation**
      // Simulation de navigation
      function onNavigate(pathname) {
        document.body.innerHTML = ROUTES({ pathname });
      }
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // **Exécution**
      // Simulation du téléchargement de fichier
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["test-valid-extension.jpg"], "test-valid-extension.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });

      // **Assertions**
      // assertion pour verifier que "handleChangeFile" a bien été déclenchée après le téléchargement.
      expect(handleChangeFile).toHaveBeenCalled();
      // Assertion pour verifier le du type du fichier
      expect(inputFile.files[0].type).toBe("image/jpg");
    });

    test("Then I upload a file with invalid extension", async () => {
      // **Préparation**
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // **Exécution**
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(
              ["test-invalid-extension.gif"],
              "test-invalid-extension.gif",
              { type: "image/gif" }
            ),
          ],
        },
      });

      // **Assertions**

      // Vérification que handleChangeFile a été appelée
      expect(handleChangeFile).toHaveBeenCalled();
      // Vérification du type du fichier téléchargé 
      expect(inputFile.files[0].type).toBe("image/gif");
      // Vérification que le champ d'upload est vidé
      expect(inputFile.value).toBe("");
      // Vérification du message d'erreur affiché
      const errorMessage = screen.getByText(
        "Seule les fichiers .jpg, .png .jepg sont autorisées"
      );
      expect(errorMessage).toBeTruthy();
    });
  });
  // Ce test vérifie que lorsqu'une erreur survient dans la méthode handleChangeFile,
  // l'erreur est correctement interceptée et enregistrée dans la console
  describe("When I am on NewBill Page and an error occurs in handleChangeFile", () => {
    test("Then the error should be caught and logged in the console", async () => {
      // **Préparation**
      // Intercepte console.error pour éviter qu'il ne pollue les logs
      const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Mock de store avec une méthode bills().create() qui rejette une erreur
      const mockStoreWithError = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("Mocked error"))),
        })),
      };

      // Nouvelle instance de la classe NewBill avec un mock de store qui simule une erreur
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStoreWithError,
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");

      // **Exécution**
      // Simulation de changement de fichier
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["content"], "file.png", { type: "image/png" })],
        },
      });

      // Appel manuel de handleChangeFile
      await newBill.handleChangeFile({
        preventDefault: jest.fn(),
        target: inputFile,
      });

      // **Assertions**
      // Vérifie que console.error a été appelé avec une erreur
      expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));

      // Nettoie le mock
      consoleErrorMock.mockRestore();
    });
  });

  // Ce test vérifie que si une erreur survient lors de la soumission du formulaire de la page NewBill,
  // elle est correctement interceptée et enregistrée dans la console
  describe("When I submit the New Bill form and an error occurs in handleSubmit", () => {
    test("Then the error should be caught and logged in the console", async () => {
      // **Préparation**
      const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const mockStoreWithError = {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Mocked error"))),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStoreWithError,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");

      // **Exécution**
      fireEvent.submit(formNewBill);
      await newBill.handleSubmit({
        preventDefault: jest.fn(),
        target: formNewBill,
      });

      // **Assertions**
      expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));

      consoleErrorMock.mockRestore();
    });
  });

  // Ce test vérifie que lorsqu'un utilisateur crée une nouvelle note de frais , l'application :
  // 1-Envoie les données à l'API pour un enregistrement (via une requête POST mockée)
  // 2-Redirige l'utilisateur vers la page des factures (Bills Page).

  describe("When I create a new bill", () => {
    test("Then the navigation to Bills page should be triggered", () => {
      // **Préparation**
      // Mock de la fonction onNavigate
      const onNavigate = jest.fn();
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");

      // **Exécution**
      // Simule la soumission du formulaire
      fireEvent.submit(formNewBill);

      // **Assertions**
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
  
describe("when I want to update an invoice via the store API", () => {
  let storeMock, onNavigateMock, billInstance;

  beforeEach(() => {
    storeMock = {
      bills: jest.fn().mockReturnValue({
        update: jest.fn(),
      }),
    };
    // Mock de la navigation
    onNavigateMock = jest.fn();

    billInstance = new NewBill({ store: storeMock, onNavigate: onNavigateMock });
    // Espionner console.error
    console.error = jest.fn();
  });

  test("Then if the update succeeds, the user is redirected", async () => {
    // Arrange
    storeMock.bills().update.mockResolvedValue({});
    const bill = { id: "123", amount: 100 };

    // Act
    await billInstance.updateBill(bill);

    // Assert
    // Vérifie appel à bills()
    expect(storeMock.bills).toHaveBeenCalled(); 
    expect(storeMock.bills().update).toHaveBeenCalledWith({
      data: JSON.stringify(bill),
      // Utilisation correcte de l'ID
      selector: bill.id, 
    }); // Vérifie appel à update() avec les bons arguments
    // Vérifie la redirection
    expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH["Bills"]); 
    // Vérifie qu'aucune erreur n'a été loguée
    expect(console.error).not.toHaveBeenCalled(); 
  });



  test("Then if the API does not respond, no action is taken", async () => {
    // Arrange
    storeMock.bills().update.mockRejectedValue(new Error("API unavailable"));
    const bill = { id: "123", amount: 100 };

    // Act
    await billInstance.updateBill(bill);

    // Assert
    expect(storeMock.bills).toHaveBeenCalled();
    expect(storeMock.bills().update).toHaveBeenCalled();
    // Vérifie qu'il n'y a pas de redirection
    expect(onNavigateMock).not.toHaveBeenCalled();
    // Vérifie que l'erreur a bien été loguée
    expect(console.error).toHaveBeenCalled(); 
  });
});

});









