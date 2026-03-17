// src/api/endpoints/loans.js
import { FAKE_LOANS } from '../mock'; // Proveri da li je putanja do mock.js tačna

export const loansApi = {
  // Umesto pravog API poziva, vraćamo Promise sa tvojim podacima
  getAll: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: FAKE_LOANS });
      }, 500); // Simuliramo pola sekunde učitavanja
    });
  },

  getById: (id) => {
    return new Promise((resolve) => {
      const loan = FAKE_LOANS.find(l => l.id === id);
      resolve({ data: loan });
    });
  },

  createRequest: (data) => {
    return new Promise((resolve) => {
      console.log("Simulacija slanja zahteva:", data);
      resolve({ status: 201, message: "Zahtev primljen" });
    });
  }
};