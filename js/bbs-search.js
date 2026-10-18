
document.addEventListener('DOMContentLoaded',function(){
  const input=document.querySelector('[data-bbs-search]');
  if(!input)return;
  const rows=[...document.querySelectorAll('[data-bbs-row]')];
  const count=document.querySelector('[data-bbs-count]');
  input.addEventListener('input',function(){
    const q=this.value.trim().toLowerCase();
    let visible=0;
    rows.forEach(row=>{
      const ok=!q || row.textContent.toLowerCase().includes(q);
      row.style.display=ok?'':'none';
      if(ok) visible++;
    });
    if(count) count.textContent=q?visible+'개 검색됨':rows.length+'개';
  });
});
