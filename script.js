document.addEventListener('DOMContentLoaded', () => {
    const memoryList = document.getElementById('memory-list');
    const thoughtList = document.getElementById('thought-list');
    const addMemoryBtn = document.getElementById('add-memory-btn');
    const addThoughtBtn = document.getElementById('add-thought-btn');
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const saveBtn = document.getElementById('save-memory-btn');
    const memoryTypeSelect = document.getElementById('memory-type-select');
    const categoryInput = document.getElementById('category-input');
    const knowledgeInput = document.getElementById('knowledge-input');
    const parentCategorySelect = document.getElementById('parent-category');

    let memoryCounter = 0; // 記憶アイテムのID生成用カウンター
    let thoughtCounter = 0; // 思考ブロックのID生成用カウンター

    // --- 初期データの描画 (例) ---
    function renderInitialData() {
        // 例：カテゴリ
        addMemory('カテゴリA', 'category', null);
        addMemory('知識1', 'knowledge', 'カテゴリA', '要素XとYの関係');
        addMemory('知識2', 'knowledge', 'カテゴリA', '要素Zの結果');
        addMemory('カテゴリB', 'category', null);
        addMemory('知識3', 'knowledge', 'カテゴリB', '関連情報');
        
        // 例：思考ブロック
        addThought();
    }
    renderInitialData();

    // --- 記憶アイテムの追加関数 ---
    function addMemory(name, type, parentId = null, relation = '') {
        memoryCounter++;
        const id = `memory-${memoryCounter}`;
        const item = document.createElement('div');
        item.classList.add('memory-item', `${type}-item`);
        item.setAttribute('draggable', true);
        item.setAttribute('data-id', id);
        item.setAttribute('data-type', type);
        item.setAttribute('data-name', name);
        item.setAttribute('data-relation', relation);

        item.innerHTML = `
            <div>${type === 'category' ? '📁' : '💡'} ${name}</div>
            ${type === 'knowledge' ? `<div class="relation">${relation}</div>` : ''}
        `;

        if (parentId) {
            // 知識の場合、親カテゴリを探してその直後に追加
            const parentElement = memoryList.querySelector(`[data-id="${parentId}"]`);
            if (parentElement) {
                parentElement.parentNode.insertBefore(item, parentElement.nextSibling);
            } else {
                memoryList.appendChild(item);
            }
        } else {
            // カテゴリの場合、リストの末尾に追加
            memoryList.appendChild(item);
        }
        
        setupDragDrop(item);
        updateCategorySelect();
    }

    // --- 思考ブロックの追加関数 ---
    function addThought() {
        thoughtCounter++;
        const id = `thought-${thoughtCounter}`;
        const block = document.createElement('div');
        block.classList.add('thought-block');
        
        block.innerHTML = `
            <h3>思考ブロック ${thoughtCounter} <button data-id="${id}" class="remove-thought-btn">×</button></h3>
            <div class="free-input-area">
                <textarea placeholder="自由入力欄"></textarea>
            </div>
            <div class="placement-area" data-thought-id="${id}">配置欄</div>
        `;

        thoughtList.appendChild(block);
        setupDropZone(block.querySelector('.placement-area'));

        // 削除ボタンのイベント設定
        block.querySelector('.remove-thought-btn').addEventListener('click', (e) => {
            e.target.closest('.thought-block').remove();
        });
    }

    // --- カテゴリ選択肢の更新 ---
    function updateCategorySelect() {
        parentCategorySelect.innerHTML = '<option value="">(なし/カテゴリを選択)</option>';
        memoryList.querySelectorAll('.category-item').forEach(category => {
            const option = document.createElement('option');
            option.value = category.getAttribute('data-id');
            option.textContent = category.getAttribute('data-name');
            parentCategorySelect.appendChild(option);
        });
    }

    // --- モーダル操作 ---
    addMemoryBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        updateCategorySelect(); // モーダルが開くたびにカテゴリを更新
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    memoryTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'category') {
            categoryInput.style.display = 'block';
            knowledgeInput.style.display = 'none';
        } else {
            categoryInput.style.display = 'none';
            knowledgeInput.style.display = 'block';
        }
    });

    saveBtn.addEventListener('click', () => {
        const type = memoryTypeSelect.value;
        let name, relation, parentId = null;

        if (type === 'category') {
            name = document.getElementById('category-name').value.trim();
        } else {
            name = document.getElementById('knowledge-name').value.trim();
            relation = document.getElementById('element-relation').value.trim();
            parentId = parentCategorySelect.value;
        }

        if (name) {
            addMemory(name, type, parentId, relation);
            modal.style.display = 'none';
            // 入力欄をクリア (実装に応じて適宜追加)
        } else {
            alert('名前を入力してください。');
        }
    });
    
    // --- 思考ブロックの追加ボタン ---
    addThoughtBtn.addEventListener('click', addThought);

    // --- ドラッグ＆ドロップ機能 ---
    
    // ドラッグ開始時
    function setupDragDrop(item) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
            e.dataTransfer.effectAllowed = 'copy';
            e.target.style.opacity = '0.4';
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    }

    // ドロップゾーンの設定
    function setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy';
            dropZone.style.backgroundColor = '#E6FFFA'; // ドラッグオーバー時の視覚的フィードバック
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.backgroundColor = '#FAFAFA'; 
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = '#FAFAFA';

            const memoryId = e.dataTransfer.getData('text/plain');
            const originalItem = document.querySelector(`[data-id="${memoryId}"]`);
            
            if (originalItem) {
                // ドロップされたアイテムの複製を作成
                const type = originalItem.getAttribute('data-type');
                const name = originalItem.getAttribute('data-name');
                const relation = originalItem.getAttribute('data-relation');
                const newPlacedItem = document.createElement('span');
                
                newPlacedItem.classList.add('placed-item');
                let content = name;
                if (type === 'knowledge' && relation) {
                    content = `${name} (${relation})`;
                }
                newPlacedItem.textContent = content;

                // 配置欄に追加
                if (dropZone.textContent.includes('配置欄')) {
                    dropZone.textContent = ''; // 初期テキストを削除
                }
                dropZone.appendChild(newPlacedItem);
            }
        });
    }
});
