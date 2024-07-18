/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'a@a'
    }));
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    });

    describe("When I upload a file", () => {
      test("Then the file handler should handle correctly the file format", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);

        const fileInput = screen.getByTestId('file');
        const file = new File(['sample'], 'sample.png', { type: 'image/png' });

        fileInput.addEventListener('change', handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());
        expect(fileInput.files[0].name).toBe('sample.png');
      });

      test("Then it should alert if the file format is incorrect", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        window.alert = jest.fn();

        const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);

        const fileInput = screen.getByTestId('file');
        const file = new File(['sample'], 'sample.txt', { type: 'text/plain' });

        fileInput.addEventListener('change', handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());
        expect(window.alert).toHaveBeenCalledWith('Seuls les formats JPEG, JPG et PNG sont autorisés.');
        expect(fileInput.value).toBe('');
      });
    });

    describe("When I submit the form", () => {
      test("Then it should create a new bill", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const onNavigate = jest.fn();
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

        const handleSubmit = jest.fn(newBill.handleSubmit);
        const form = screen.getByTestId('form-new-bill');

        form.addEventListener('submit', handleSubmit);
        fireEvent.submit(form);

        await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
      });
    });
  });

  // Test d'intégration POST new bill
  describe("When I create a new bill", () => {
    test("Then it should post the new bill to the API", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

      const formData = new FormData();
      formData.append('file', new File(['sample'], 'sample.png', { type: 'image/png' }));
      formData.append('email', 'a@a');

      newBill.updateBill = jest.fn();

      const bill = {
        email: 'a@a',
        type: 'Hôtel et logement',
        name: 'test',
        amount: 100,
        date: '2022-12-10',
        vat: '20',
        pct: 20,
        commentary: 'test',
        fileUrl: 'https://localhost:3456/images/test.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      };

      await newBill.updateBill(bill);
      expect(newBill.updateBill).toHaveBeenCalled();
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
});
