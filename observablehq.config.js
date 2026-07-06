// Configuracion del tablero JCF. Sin interpreters: los datos son CSV estaticos.
export default {
  title: "JCF: tablero de analisis",
  toc: true,
  search: true,
  pages: [
    {
      name: "Padron JCF",
      open: true,
      pages: [
        { name: "Nacional", path: "/padron/nacional" },
        { name: "Estatal", path: "/padron/estatal" },
        { name: "Municipal", path: "/padron/municipal" }
      ]
    },
    {
      name: "ENIGH JCF",
      open: true,
      pages: [
        { name: "Nacional", path: "/enigh/nacional" },
        { name: "Estatal", path: "/enigh/estatal" }
      ]
    }
  ]
};
