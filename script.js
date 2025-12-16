/* =========================================
   JavaScript: ロジックの実装
   ========================================= */

// --- データ管理用の変数 ---
let idCounter = 1;
function generateId() { return 'id-' + idCounter++; }

let memories = [];
let thoughts = [];
let customTemplates = {}; // ユーザー作成のテンプレート

// --- DOM要素 ---
const memoryListEl = document.getElementById('memory-list');
const thoughtContainerEl = document.getElementById('thought-container');
const modalOverlay = document.getElementById('modal-overlay');
const categoryGroup = document.getElementById('input-category-group');
const knowledgeGroup = document.getElementById('input-knowledge-group');
const targetCategorySelect = document.getElementById('target-category-select');

// テンプレート関連DOM
const templateSelect = document.getElementById('template-select');
const presetGroup = document.getElementById('preset-group');
const customGroup = document.getElementById('custom-group');
const deleteTemplateBtn = document.getElementById('delete-template-btn');

// IO関連DOM
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');

// --- 永続化（LocalStorage） ---

function saveData() {
    const data = {
        memories: memories,
        thoughts: thoughts,
        idCounter: idCounter,
        customTemplates: customTemplates
    };
    localStorage.setItem('memoApp_data', JSON.stringify(data));
}

function loadData() {
    const json = localStorage.getItem('memoApp_data');
    if (json) {
        try {
            const data = JSON.parse(json);
            memories = data.memories || [];
            thoughts = data.thoughts || [];
            idCounter = data.idCounter || 1;
            customTemplates = data.customTemplates || {};
        } catch (e) {
            console.error("データ読み込みエラー", e);
        }
    }
}

function clearAllData() {
    if (confirm("全てのデータを削除しますか？\n（マイテンプレートも含むすべての保存データが消えます）")) {
        localStorage.removeItem('memoApp_data');
        location.reload();
    }
}

// --- 初期化 ---
loadData();
updateTemplateDropdown(); // プルダウンの更新
renderMemories();
renderThoughts();

// --- イベントリスナー ---

document.getElementById('clear-all-btn').addEventListener('click', clearAllData);

// ★テンプレート保存ボタン
document.getElementById('save-template-btn').addEventListener('click', () => {
    if (memories.length === 0) {
        alert("保存する記憶データがありません。");
        return;
    }

    const name = prompt("テンプレート名を入力してください:", "マイテンプレート");
    if (!name) return;

    if (customTemplates[name]) {
        if (!confirm(`「${name}」は既に存在します。上書きしますか？`)) {
            return;
        }
    }

    customTemplates[name] = JSON.parse(JSON.stringify(memories));
    saveData();
    updateTemplateDropdown();
    
    // 保存したものを選択状態にする
    templateSelect.value = "custom:" + name;
    updateTemplateControls(); // ボタン表示更新
    
    alert(`テンプレート「${name}」を保存しました。`);
});

// ★テンプレート削除ボタン
deleteTemplateBtn.addEventListener('click', () => {
    const value = templateSelect.value;
    if (!value.startsWith('custom:')) return;

    const name = value.replace('custom:', '');
    if (confirm(`テンプレート「${name}」を削除しますか？`)) {
        delete customTemplates[name];
        saveData();
        updateTemplateDropdown();
        templateSelect.value = ""; // 選択解除
        updateTemplateControls(); // ボタン表示更新
    }
});

// ★プルダウンの変更検知
templateSelect.addEventListener('change', updateTemplateControls);

function updateTemplateControls() {
    const value = templateSelect.value;
    const isCustom = value.startsWith('custom:');
    
    // 削除ボタンの制御
    if (isCustom) {
        deleteTemplateBtn.style.display = 'block';
        exportBtn.disabled = false; // エクスポート可能
    } else {
        deleteTemplateBtn.style.display = 'none';
        exportBtn.disabled = true; // プリセットや未選択はエクスポート不可
    }
}

// ★プルダウンの内容更新
function updateTemplateDropdown() {
    presetGroup.innerHTML = '';
    customGroup.innerHTML = '';

    // 1. プリセット
    if (typeof TEMPLATES !== 'undefined') {
        for (const key in TEMPLATES) {
            const opt = document.createElement('option');
            opt.value = "preset:" + key;
            opt.textContent = key;
            presetGroup.appendChild(opt);
        }
    }

    // 2. マイテンプレート
    for (const key in customTemplates) {
        const opt = document.createElement('option');
        opt.value = "custom:" + key;
        opt.textContent = key;
        customGroup.appendChild(opt);
    }
}

// ★テンプレート読込ボタン
document.getElementById('load-template-btn').addEventListener('click', () => {
    const value = templateSelect.value;
    if (!value) return;

    let targetData = null;

    if (value.startsWith('preset:')) {
        const key = value.replace('preset:', '');
        if (typeof TEMPLATES !== 'undefined') {
            targetData = TEMPLATES[key];
        }
    } else if (value.startsWith('custom:')) {
        const key = value.replace('custom:', '');
        targetData = customTemplates[key];
    }

    if (targetData) {
        loadTemplate(targetData);
    } else {
        alert("テンプレートデータの読み込みに失敗しました。");
    }
});

function loadTemplate(templateData) {
    const dataArray = Array.isArray(templateData) ? templateData : [];

    dataArray.forEach(tplCat => {
        const newCatId = generateId();
        const newItems = (tplCat.items || []).map(tplItem => ({
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

    saveData();
    renderMemories();
    alert("テンプレートを読み込みました");
}

// --- ★外部ファイル連携（Export/Import） ---

// 1. 書き出し (Export)
exportBtn.addEventListener('click', () => {
    const value = templateSelect.value;
    if (!value.startsWith('custom:')) return;

    const name = value.replace('custom:', '');
    const data = customTemplates[name];

    if (!data) return alert("データが見つかりません");

    // JSONデータをBlobオブジェクトに変換
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    
    // ダウンロードリンクを生成してクリックさせる
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + ".json"; // ファイル名
    document.body.appendChild(a);
    a.click();
    
    // 後始末
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// 2. 読み込み (Import) - ボタンクリックでinput発火
importBtn.addEventListener('click', () => {
    importFileInput.click();
});

// ファイルが選択されたら処理開始
importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target.result;
            const data = JSON.parse(json);
            
            // 簡易的なデータ構造チェック
            if (!Array.isArray(data)) {
                throw new Error("データ形式が正しくありません（配列ではありません）");
            }

            // ファイル名をテンプレート名として使う（拡張子を除く）
            let name = file.name.replace(/\.json$/i, "");
            
            // 既に同名がある場合、確認またはリネーム
            if (customTemplates[name]) {
                if (!confirm(`「${name}」というテンプレートは既に存在します。上書きしますか？`)) {
                    // キャンセルの場合、名前を変更して登録を試みることも可能だが今回は中断
                    importFileInput.value = ''; // リセット
                    return;
                }
            }

            // 保存
            customTemplates[name] = data;
            saveData();
            updateTemplateDropdown();
            
            // 選択状態にする
            templateSelect.value = "custom:" + name;
            updateTemplateControls();
            
            alert(`「${name}」を読み込みました！`);

        } catch (err) {
            alert("ファイルの読み込みに失敗しました。\n" + err.message);
        }
        // inputをリセット（同じファイルを再度選べるように）
        importFileInput.value = '';
    };
    reader.readAsText(file);
});


// --- 記憶・思考の作成・編集系（以前と同様） ---

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
    saveData();
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
        saveData();
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
        textarea.oninput = (e) => { 
            thoughts[index].text = e.target.value;
            saveData();
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
                saveData();
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
    saveData();
    renderMemories();
}
function deleteCategory(index) {
    if(confirm("このカテゴリと含まれる知識を削除しますか？")) {
        memories.splice(index, 1);
        saveData();
        renderMemories();
    }
}
function editCategory(index) {
    const newName = prompt("カテゴリ名を編集:", memories[index].name);
    if(newName) {
        memories[index].name = newName;
        saveData();
        renderMemories();
    }
}

function deleteKnowledge(catIndex, kIndex) {
    if(confirm("この知識を削除しますか？")) {
        memories[catIndex].items.splice(kIndex, 1);
        saveData();
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
            saveData();
            renderMemories();
        }
    }
}

function deleteThought(index) {
    if(confirm("この思考シートを削除しますか？")) {
        thoughts.splice(index, 1);
        saveData();
        renderThoughts();
    }
}
function editThoughtName(index) {
    const newName = prompt("思考名を編集:", thoughts[index].name);
    if(newName) {
        thoughts[index].name = newName;
        saveData();
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
        saveData();
        renderThoughts();
    } catch(err) {
        console.error("Drop error", err);
    }
}
