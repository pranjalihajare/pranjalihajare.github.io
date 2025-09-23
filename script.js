
    (function(){
      const qs = s => document.querySelector(s);
      const qsa = s => document.querySelectorAll(s);

      const input = qs('#task-input');
      const addBtn = qs('#add-btn');
      const tasksEl = qs('#tasks');
      const countEl = qs('#count');
      const filterBtns = [...qsa('.filters button[data-filter]')];
      const clearCompletedBtn = qs('#clear-completed');
      const toggleAllBtn = qs('#select-all');

      const STORAGE_KEY = 'vanilla_todo_tasks_v1';

      let tasks = loadTasks();
      let filter = 'all';

      function saveTasks(){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      }

      function loadTasks(){
        try{
          const raw = localStorage.getItem(STORAGE_KEY);
          if(!raw) return [];
          return JSON.parse(raw);
        }catch(e){
          console.error('Failed to load tasks', e);
          return [];
        }
      }

      function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,7)}

      function addTask(title){
        title = title && title.trim();
        if(!title) return;
        tasks.unshift({id:uid(), title, completed:false, createdAt: new Date().toISOString()});
        saveTasks();
        render();
      }

      function removeTask(id){
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
      }

      function toggleTask(id){
        tasks = tasks.map(t => t.id===id ? {...t, completed: !t.completed} : t);
        saveTasks();
        render();
      }

      function clearCompleted(){
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        render();
      }

      function toggleAll(){
        const allCompleted = tasks.length && tasks.every(t => t.completed);
        tasks = tasks.map(t => ({...t, completed: !allCompleted}));
        saveTasks();
        render();
      }

      function setFilter(f){
        filter = f;
        filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter===f));
        render();
      }

      function formatTime(iso){
        const d = new Date(iso);
        return d.toLocaleString();
      }

      function render(){
        // apply filter
        let visible = tasks.slice();
        if(filter==='active') visible = visible.filter(t=>!t.completed);
        if(filter==='completed') visible = visible.filter(t=>t.completed);

        tasksEl.innerHTML = '';
        if(visible.length===0){
          const li = document.createElement('li');
          li.className = 'task';
          li.innerHTML = '<div class="left"><div class="title small">No tasks here — add one!</div></div>';
          tasksEl.appendChild(li);
        } else {
          visible.forEach(t => {
            const li = document.createElement('li');
            li.className = 'task' + (t.completed ? ' completed' : '');

            const left = document.createElement('div'); left.className='left';
            const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = t.completed;
            cb.addEventListener('change', ()=> toggleTask(t.id));

            const title = document.createElement('div'); title.className='title'; title.textContent = t.title;
            title.contentEditable = true;
            title.spellcheck = false;
            title.addEventListener('blur', ()=>{
              const newText = title.textContent.trim();
              if(!newText){ removeTask(t.id); return; }
              tasks = tasks.map(x => x.id===t.id ? {...x, title:newText} : x);
              saveTasks();
              render();
            });
            title.addEventListener('keydown', (e)=>{
              if(e.key==='Enter'){ e.preventDefault(); title.blur(); }
            });

            const meta = document.createElement('div'); meta.className='meta small'; meta.textContent = formatTime(t.createdAt);

            left.appendChild(cb); left.appendChild(title); left.appendChild(meta);

            const actions = document.createElement('div'); actions.className='actions';
            const del = document.createElement('button'); del.className='btn btn-ghost small'; del.textContent='Delete';
            del.addEventListener('click', ()=> removeTask(t.id));

            actions.appendChild(del);

            li.appendChild(left);
            li.appendChild(actions);
            tasksEl.appendChild(li);
          });
        }

        // count
        const remaining = tasks.filter(t=>!t.completed).length;
        countEl.textContent = `${remaining} item${remaining!==1 ? 's' : ''} left`;
      }

      // events
      addBtn.addEventListener('click', ()=>{ addTask(input.value); input.value=''; input.focus(); });
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ addTask(input.value); input.value=''; } });

      filterBtns.forEach(btn => btn.addEventListener('click', ()=> setFilter(btn.dataset.filter)));
      clearCompletedBtn.addEventListener('click', ()=>{ clearCompleted(); });
      toggleAllBtn.addEventListener('click', ()=>{ toggleAll(); });

      // initial render
      render();

      // expose for debugging (optional)
      window.__todo = {get tasks(){return tasks}, addTask, removeTask, toggleTask, clearCompleted};
    })();