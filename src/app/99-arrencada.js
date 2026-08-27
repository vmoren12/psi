/* ---------- 13. Arrencada ---------- */
document.querySelectorAll("#nav button").forEach(b => b.onclick = () => go(b.dataset.view));
$("#modal").addEventListener("click", e => { if(e.target.id==="modal") closeModal(); });
$("#dlg").addEventListener("click", e => { if(e.target.id==="dlg") tancaDlg(null); });
document.addEventListener("keydown", e => {
  if(e.key !== "Escape") return;
  if(dlgResol) tancaDlg(null); else closeModal();
});
window.addEventListener("beforeunload", desa);
try{ capsaleraNavegador(localStorage.getItem(KEY_CAPS) === "1"); }catch(e){}
carregaUI();
carrega();
carregaCopia();
/* L'historial s'obre en segon pla: si el navegador no en dona, es fa servir la
   reserva en memòria i la pantalla ho diu. */
histObre().then(db => { histDB = db; histPersistent = !!db; return histCarregaIndex(); });
setInterval(tickCopies, TICK_COPIES);
document.addEventListener("visibilitychange", () => { if(!document.hidden) tickCopies(); });
go("dashboard");
pintaAvis();
mesuraBarres();

