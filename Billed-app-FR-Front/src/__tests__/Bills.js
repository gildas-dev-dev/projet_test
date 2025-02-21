/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

 // Ce code teste si les données sont correctement récupérées depuis une API simulée et si l'interface
// utilisateur réagit comme attendu
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

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
       // Arrange (préparation)
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);
      // act (Action)
      await waitFor(() => screen.getByText("Validations"));
      const statutValide = await screen.getByText("En attente (1)");
      const statutRefuse = await screen.getByText("Refusé (2)");
       //Assert (Vérification)
      expect(statutValide).toBeTruthy();
      expect(statutRefuse).toBeTruthy();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    // Ce test vérifie que l'icône "Notes de frais" dans le menu latéral est bien mise en 
    // surbrillance lorsque l'utilisateur est sur la page des notes de frais.

    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Arrange (préparation)
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      //act (Action)
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      
      
      //Code complété
      // act (Action)
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // Ce test vérifie que les notes de frais sont triées de la plus ancienne à la plus récente.
    test("Then bills should be ordered from earliest to latest", () => {
      // Arrange(préparation)
      document.body.innerHTML = BillsUI({ data: bills });
    
      // Act(action)
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a > b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
    
      // Assert (vérification)
      expect(dates).toEqual(datesSorted);
    });
  });
});

// Ce test vérifie que la modale s'ouvre correctement lorsqu'on
//clique sur l'icône "voir" d'une note de frais.
describe("When I am on Bills Page and I click on icon eye", () => {
  test("Then a modal should open", () => {
    // Arrange (préparation)
    //Cette fonction permet de simuler une navigation vers une autre route en modifiant le contenu du document.body
    function onNavigate(pathname) {
      document.body.innerHTML = ROUTES({ pathname });
    }
    //génération du DOM de la page...
    document.body.innerHTML = BillsUI({ data: bills });
    // Création d'une nouvelle instance
    const toutesLesFactures = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });

    $.fn.modal = jest.fn(); 

    // Act (action)
    const pemiereIcone = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn(() =>
      toutesLesFactures.handleClickIconEye(pemiereIcone)
    );
    pemiereIcone.addEventListener("click", handleClickIconEye);
    userEvent.click(pemiereIcone);

    // Assert (vérification)
    expect(handleClickIconEye).toHaveBeenCalled();

    const modal = screen.getByTestId("modaleFile");
    expect(modal).toBeTruthy();
  });
});

// Ce test vérifie que l'utilisateur est redirigé vers le formulaire
// de création d'une nouvelle note de frais lorsqu'il clique sur le bouton 
// "Nouvelle note de frais".
describe("When I am on Bills Page and I click on the new bill button", () => {
  test("Then I should be sent on the new bill page form", () => {
    // Arrange (préparation)
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });

    const toutesLesFactures = new Bills({
      document,
      onNavigate,
      store: null,
      localStorageMock,
    });

    // Act (Action)
    const handleClickNewBill = jest.fn(() => toutesLesFactures.handleClickNewBill());

    const nouveauBoutonFacture = screen.getByTestId("btn-new-bill");
    nouveauBoutonFacture.addEventListener("click", handleClickNewBill);
    userEvent.click(nouveauBoutonFacture);

    // Assert (Vérification)
    // On verifie que la méthode de gestion du clic est bien appelée
    expect(handleClickNewBill).toHaveBeenCalled();
    const formNewBill = screen.getByTestId("form-new-bill");
    // on verifie que le formulaire est affiché
    expect(formNewBill).toBeTruthy();
  });
});

// Ce test est un test d'intégration qui vérifie que les données des notes de 
// frais sont bien récupérées depuis l'API

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      // Arrange (préparation)
      const methodeSpy = jest.spyOn(mockStore, "bills");

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      // Act (Action)
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Assert (Vérification)
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();

      expect(methodeSpy).toHaveBeenCalled();

      const toutesLesFacturesUI = screen.getAllByTestId("bill-list-item");
      expect(toutesLesFacturesUI.length).toEqual(4);
    });
  });

  describe("When I navigate to Bills Page and an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      expect(screen.getByText())
    });
  });
});
