/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      const windowClass = windowIcon.classList
      expect(windowClass).toContain('active-icon')
    })
  })
  test("Then bills should be ordered from earliest to latest", () => {
    document.body.innerHTML = BillsUI({ data: bills })
    const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
    const antiChrono = (a, b) => ((a < b) ? 1 : -1)
    const datesSorted = [...dates].sort(antiChrono)
    console.log('dates:' + dates)
    console.log('dates triées:' + datesSorted)
    expect(dates).toEqual(datesSorted)
  })
  describe("When I click on the icon eye", () => {
    test("Then the bill image should appear in a modal", async () => {
      // DOM
      document.body.innerHTML = BillsUI({ data: bills })

      // Simuler la configuration du localStorage et de la navigation
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // Naviguer vers la page Bills
      window.onNavigate(ROUTES_PATH.Bills)

      // Simulation de la fonction modal
      $.fn.modal = jest.fn()

      //Récupérer l'élément icon-eye
      const iconEye = screen.getAllByTestId('icon-eye')[0]

      // Simuler le clic sur eyeIcon
      fireEvent.click(iconEye)

      // Vérifier que la modale s'ouvre et affiche l'image
      await waitFor(() => {
        const modal = document.getElementById('modaleFile')
        expect(modal).toBeTruthy()
        expect($.fn.modal).toHaveBeenCalled()

        const modalBody = modal.querySelector('.modal-body')
        const img = modalBody.querySelector('img')
        expect(img).toBeTruthy();
        expect(img.getAttribute('src')).toBe(bills[0].fileUrl)
      })

    })
  })
})

// Test d'integration GET
describe("I'm a user connected as Employee", () => {
  describe("When I call getBills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const billsList = await screen.getByTestId("tbody");
      expect(billsList).toBeTruthy();
      const billNames = screen.getAllByText("encore");
      expect(billNames.length).toBeGreaterThan(0);
    });
  
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        );
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
  
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            }
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
  
      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            }
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
  
})
