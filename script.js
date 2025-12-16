/* =========================================
   JavaScript: ロジックの実装
   ========================================= */

// --- データ管理用の変数 ---
let idCounter = 1;
function generateId() { return 'id-' + idCounter++; }

let memories = [];
let thoughts = [];

// --- DOM要素 ---
const memoryListEl = document.getElementById('memory-list');
const thoughtContainerEl = document.getElementById('thought-container');
const modalOverlay = document.getElementById('modal-overlay');
const categoryGroup = document.getElementById('input-category-group');
const knowledgeGroup = document.getElementById('input-knowledge-group');
const targetCategorySelect = document.getElementById('target-category-select');

// --- ★永続化（LocalStorage）関連処理 ---

// データを保存する
function saveData() {
    const data = {
        memories: memories,
        thoughts: thoughts,
        idCounter: idCounter
    };
    localStorage.setItem('memoApp_data', JSON.stringify(data));
}

// データを読み込む（初期化時）
function loadData() {
    const json = localStorage.getItem('memoApp_data');
    if (json) {
        try {
            const data = JSON.parse(json);
            memories = data.memories || [];
            thoughts = data.thoughts || [];
            idCounter = data.idCounter || 1;
        } catch (e) {
            console.error("データ読み込みエラー", e);
        }
    }
}

// データを全削除する
function clearAllData() {
    if (confirm("全てのデータを削除しますか？この操作は取り消せません。")) {
        localStorage.removeItem('memoApp_data');
        location.reload(); // ページをリロードして初期状態に戻す
    }
}

// --- 初期化 ---
loadData(); // ★保存されたデータを読み込む
renderMemories();
renderThoughts();

// --- イベントリスナー ---

// ★全削除ボタン
document.getElementById('clear-all-btn').addEventListener('click', clearAllData);

// ★テンプレート読込ボタン
document.getElementById('load-template-btn').addEventListener('click', () => {
    const input = document.getElementById('template-id-input');
    const templateId = input.value;
    
    // TEMPLATESはtemplates.jsで定義されている
    if (typeof TEMPLATES !== 'undefined' && TEMPLATES[templateId]) {
        loadTemplate(TEMPLATES[templateId]);
        input.value = ''; // 入力欄クリア
    } else {
        alert("指定されたIDのテンプレートが見つかりません\n(例: math, cooking)");
    }
});

// テンプレートデータを現在のメモリに追加する処理
function loadTemplate(templateData) {
    // テンプレートデータをディープコピーしてから追加（オリジナルに影響させない）
    // また、IDは現在システムに合わせて新規発行する
    
    templateData.forEach(tplCat => {
        const newCatId = generateId();
        const newItems = tplCat.items.map(tplItem => ({
            id: generateId(),
            type: 'knowledge',
            name: tplItem.name,
            relation: tplItem.relation
        }));

        memories.push({
            id: newCatId,
            type: 'category',
            name: tplCat.name,
            collapsed: false,
            items: newItems
        });
    });

    saveData(); // 保存
    renderMemories(); // 再描画
    alert("テンプレートを読み込みました");
}

document.getElementById('add-memory-btn').addEventListener('click', () => {
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-knowledge-name').value = '';
    document.getElementById('new-knowledge-relation').value = '';
    
    targetCategorySelect.innerHTML = '';
    memories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        targetCategorySelect.appendChild(opt);
    });

    const radios = document.getElementsByName('createType');
    radios[0].checked = true;
    toggleModalInputs('category');

    modalOverlay.style.display = 'flex';
});

document.getElementsByName('createType').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModalInputs(e.target.value);
    });
});

function toggleModalInputs(type) {
    if (type === 'category') {
        categoryGroup.style.display = 'block';
        knowledgeGroup.style.display = 'none';
    } else {
        categoryGroup.style.display = 'none';
        knowledgeGroup.style.display = 'block';
    }
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

function saveMemory() {
    const type = document.querySelector('input[name="createType"]:checked').value;
    
    if (type === 'category') {
        const name = document.getElementById('new-category-name').value;
        if (!name) return alert('カテゴリ名を入力してください');
        
        memories.push({
            id: generateId(),
            type: 'category',
            name: name,
            collapsed: false,
            items: []
        });

    } else {
        if (memories.length === 0) return alert('先にカテゴリを作成してください');
        
        const catId = targetCategorySelect.value;
        const name = document.getElementById('new-knowledge-name').value;
        const relation = document.getElementById('new-knowledge-relation').value;
        
        if (!name || !relation) return alert('知識名と関係を入力してください');

        const category = memories.find(m => m.id === catId);
        if (category) {
            category.items.push({
                id: generateId(),
                type: 'knowledge',
                name: name,
                relation: relation
            });
            category.collapsed = false; 
        }
    }
    closeModal();
    saveData(); // ★保存
    renderMemories();
}

document.getElementById('add-thought-btn').addEventListener('click', () => {
    const name = prompt("思考名を入力してください", "新しい思考");
    if (name) {
        thoughts.push({
            id: generateId(),
            name: name,
            text: "",
            droppedItems: []
        });
        saveData(); // ★保存
        renderThoughts();
    }
});

// --- 描画関数 ---

function renderMemories() {
    memoryListEl.innerHTML = '';
    
    memories.forEach((cat, index) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-item';
        
        catDiv.setAttribute('draggable', 'true');
        catDiv.ondragstart = (e) => handleDragStart(e, { type: 'category', name: cat.name, id: cat.id });

        const header = document.createElement('div');
        header.className = 'category-header';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';
        contentDiv.onclick = () => toggleCollapse(index);

        const arrow = document.createElement('span');
        arrow.textContent = cat.collapsed ? '▶' : '▼';
        arrow.style.fontSize = '10px';
        arrow.style.marginRight = '5px';

        const title = document.createElement('span');
        title.textContent = cat.name;

        contentDiv.appendChild(arrow);
        contentDiv.appendChild(title);

        const controls = document.createElement('div');
        
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.textContent = '✎';
        editBtn.onclick = (e) => { e.stopPropagation(); editCategory(index); };

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteCategory(index); };

        controls.appendChild(editBtn);
        controls.appendChild(delBtn);

        header.appendChild(contentDiv);
        header.appendChild(controls);
        catDiv.appendChild(header);

        const kList = document.createElement('div');
        kList.className = 'knowledge-list' + (cat.collapsed ? ' collapsed' : '');

        cat.items.forEach((item, kIndex) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'knowledge-item';
            
            itemDiv.setAttribute('draggable', 'true');
            itemDiv.ondragstart = (e) => handleDragStart(e, { 
                type: 'knowledge', 
                name: item.name, 
                relation: item.relation, 
                id: item.id 
            });

            const info = document.createElement('div');
            info.className = 'knowledge-info';
            info.innerHTML = `<span class="knowledge-name">${item.name}</span><span class="knowledge-relation">(${item.relation})</span>`;

            const itemControls = document.createElement('div');
            const kEditBtn = document.createElement('button');
            kEditBtn.className = 'icon-btn';
            kEditBtn.textContent = '✎';
            kEditBtn.onclick = () => editKnowledge(index, kIndex);

            const kDelBtn = document.createElement('button');
            kDelBtn.className = 'icon-btn';
            kDelBtn.textContent = '×';
            kDelBtn.onclick = () => deleteKnowledge(index, kIndex);

            itemControls.appendChild(kEditBtn);
            itemControls.appendChild(kDelBtn);

            itemDiv.appendChild(info);
            itemDiv.appendChild(itemControls);
            kList.appendChild(itemDiv);
        });

        catDiv.appendChild(kList);
        memoryListEl.appendChild(catDiv);
    });
}

function renderThoughts() {
    thoughtContainerEl.innerHTML = '';

    thoughts.forEach((th, index) => {
        const card = document.createElement('div');
        card.className = 'thought-card';

        const header = document.createElement('div');
        header.className = 'thought-header';

        const title = document.createElement('div');
        title.className = 'thought-title';
        title.textContent = th.name;
        title.onclick = () => editThoughtName(index);
        title.title = "クリックして名前を編集";

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.textContent = '削除';
        delBtn.onclick = () => deleteThought(index);

        header.appendChild(title);
        header.appendChild(delBtn);
        card.appendChild(header);

        const body = document.createElement('div');
        body.className = 'thought-body';

        const label1 = document.createElement('div');
        label1.className = 'input-area-label';
        label1.textContent = '自由入力欄';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'free-input';
        textarea.value = th.text;
        // 入力時に保存する
        textarea.oninput = (e) => { 
            thoughts[index].text = e.target.value;
            saveData(); // ★保存
        };

        const label2 = document.createElement('div');
        label2.className = 'drop-area-label';
        label2.textContent = '配置一覧 (ドラッグ&ドロップ)';

        const dropZone = document.createElement('div');
        dropZone.className = 'drop-area';
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
        dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
        dropZone.ondrop = (e) => handleDrop(e, index);

        th.droppedItems.forEach((dItem, dIndex) => {
            const dEl = document.createElement('div');
            dEl.className = 'dropped-item';
            
            let content = '';
            if(dItem.type === 'knowledge') {
                content = `
                    <div class="dropped-info">
                        <span class="dropped-name">${dItem.name}</span>
                        <span class="dropped-relation">${dItem.relation}</span>
                    </div>
                `;
            } else {
                content = `
                    <div class="dropped-info">
                        <span class="dropped-name">${dItem.name}</span>
                        <span class="dropped-category-tag">[カテゴリ]</span>
                    </div>
                `;
            }
            dEl.innerHTML = content;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'icon-btn';
            removeBtn.textContent = '×';
            removeBtn.style.marginLeft = "auto";
            removeBtn.onclick = () => {
                thoughts[index].droppedItems.splice(dIndex, 1);
                saveData(); // ★保存
                renderThoughts();
            };
            dEl.appendChild(removeBtn);
            dropZone.appendChild(dEl);
        });

        body.appendChild(label1);
        body.appendChild(textarea);
        body.appendChild(label2);
        body.appendChild(dropZone);

        card.appendChild(body);
        thoughtContainerEl.appendChild(card);
    });
}

// --- 操作系ロジック ---

function toggleCollapse(index) {
    memories[index].collapsed = !memories[index].collapsed;
    saveData(); // ★保存
    renderMemories();
}
function deleteCategory(index) {
    if(confirm("このカテゴリと含まれる知識を削除しますか？")) {
        memories.splice(index, 1);
        saveData(); // ★保存
        renderMemories();
    }
}
function editCategory(index) {
    const newName = prompt("カテゴリ名を編集:", memories[index].name);
    if(newName) {
        memories[index].name = newName;
        saveData(); // ★保存
        renderMemories();
    }
}

function deleteKnowledge(catIndex, kIndex) {
    if(confirm("この知識を削除しますか？")) {
        memories[catIndex].items.splice(kIndex, 1);
        saveData(); // ★保存
        renderMemories();
    }
}
function editKnowledge(catIndex, kIndex) {
    const item = memories[catIndex].items[kIndex];
    const newName = prompt("知識名を編集:", item.name);
    if(newName !== null) {
        const newRel = prompt("関係を編集:", item.relation);
        if(newRel !== null) {
            item.name = newName;
            item.relation = newRel;
            saveData(); // ★保存
            renderMemories();
        }
    }
}

function deleteThought(index) {
    if(confirm("この思考シートを削除しますか？")) {
        thoughts.splice(index, 1);
        saveData(); // ★保存
        renderThoughts();
    }
}
function editThoughtName(index) {
    const newName = prompt("思考名を編集:", thoughts[index].name);
    if(newName) {
        thoughts[index].name = newName;
        saveData(); // ★保存
        renderThoughts();
    }
}

// --- ドラッグ&ドロップ ---

function handleDragStart(e, data) {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDrop(e, thoughtIndex) {
    e.preventDefault();
    e.target.closest('.drop-area').classList.remove('drag-over');
    
    const raw = e.dataTransfer.getData('text/plain');
    if(!raw) return;

    try {
        const data = JSON.parse(raw);
        thoughts[thoughtIndex].droppedItems.push(data);
        saveData(); // ★保存
        renderThoughts();
    } catch(err) {
        console.error("Drop error", err);
    }
}
