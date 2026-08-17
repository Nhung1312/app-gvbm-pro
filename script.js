// ================= FIREBASE AUTH & DATABASE GVBM =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQz-4TAujSNhDV8wQY82-wnCTGJtdxhsM", 
  authDomain: "quan-ly-day-them-f7b1e.firebaseapp.com",
  projectId: "quan-ly-day-them-f7b1e",
  storageBucket: "quan-ly-day-them-f7b1e.firebasestorage.app",
  messagingSenderId: "613673074776",
  appId: "1:613673074776:web:639fe0c51ae83b56a8ca2d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
const loginScreen = document.getElementById('login-screen');
const btnLogin = document.getElementById('btn-login');

if(btnLogin) {
    btnLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => alert("Lỗi đăng nhập: " + error.message));
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        if(loginScreen) loginScreen.style.display = 'none';

        const userRef = doc(firestoreDb, 'khach_hang_gvbm', user.uid);
        let hasAccess = true;

        try {
            const docUserSnap = await getDoc(userRef);
            const ngayHienTai = new Date();

            if (!docUserSnap.exists()) {
                let ngayHetHan = new Date();
                ngayHetHan.setDate(ngayHienTai.getDate() + 30);
                await setDoc(userRef, { email: user.email, ngay_dang_ky: ngayHienTai.toISOString(), ngay_het_han: ngayHetHan.toISOString() });
            } else {
                const duLieu = docUserSnap.data();
                const ngayHetHan = new Date(duLieu.ngay_het_han);
                const timeDiff = ngayHetHan.getTime() - ngayHienTai.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (daysLeft <= 0) {
                    hasAccess = false;
                    document.getElementById('man-hinh-thu-phi').style.display = 'block';
                    let emailElements = document.getElementsByClassName('email-user');
                    for (let i = 0; i < emailElements.length; i++) emailElements[i].innerText = user.email.split('@')[0];
                }
            }
        } catch (error) { console.log("Lỗi kiểm tra bản quyền:", error); }

        if (hasAccess) {
            try {
                const docRef = doc(firestoreDb, "DuLieuGVBM", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    appData = docSnap.data(); 
                } else {
                    await setDoc(docRef, appData); 
                }
            } catch(e) {
                console.warn("Lỗi tải mây:", e);
            }
            window.initAppUI();
        }
    } else {
        currentUser = null;
        if(loginScreen) loginScreen.style.display = 'flex';
    }
});

window.logoutApp = function() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?")) {
        signOut(auth).then(() => {
            localStorage.removeItem('gvbmData_v1'); 
            location.reload();
        });
    }
};

// ================= DỮ LIỆU MẶC ĐỊNH & KHỞI TẠO =================
const defaultCommentRules = [
    { min: 9.0, max: 10.0, text: "Nắm vững kiến thức, tiếp tục phát huy." },
    { min: 8.0, max: 8.9, text: "Nắm khá vững kiến thức, cần phát huy." },
    { min: 6.5, max: 7.9, text: "Nắm được kiến thức, cần cố gắng thêm." },
    { min: 5.0, max: 6.4, text: "Đạt yêu cầu, cần củng cố kiến thức." },
    { min: 3.5, max: 4.9, text: "Chưa đạt yêu cầu, cần cố gắng hơn." },
    { min: 0.0, max: 3.4, text: "Chưa nắm vững kiến thức, cần củng cố thêm." }
];

function initData() {
    let saved = JSON.parse(localStorage.getItem('gvbmData_v1'));
    if (!saved) {
        return {
            settings: {
                teacherName: "Thầy / Cô",
                subject: "Toán học",
                year: "2025-2026",
                semester: "HK1",
                currentClass: "TOÁN HỌC - 6A",
                txColumns: 4,
                commentRules: defaultCommentRules
            },
            classes: {}
        };
    }
    return saved;
}

let appData = initData();
let syncTimeout = null;

window.saveData = function() { 
    localStorage.setItem('gvbmData_v1', JSON.stringify(appData)); 
    window.refreshAllViews();
    if (currentUser) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            const docRef = doc(firestoreDb, "DuLieuGVBM", currentUser.uid);
            setDoc(docRef, appData).then(() => { console.log("☁️ Đã đồng bộ nền lên Firebase!"); }).catch(e => console.error(e));
        }, 2000);
    }
};

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container'); 
    const toast = document.createElement('div'); 
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle text-green' : 'fa-exclamation-circle text-red'}"></i> <span>${message}</span>`; 
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px)'; setTimeout(() => toast.remove(), 300); }, 3000);
};

// ================= ĐIỀU HƯỚNG VIEW & DRAWER =================
window.toggleDrawer = function(open) {
    document.getElementById('drawer').classList.toggle('active', open);
    document.getElementById('drawer-overlay').classList.toggle('active', open);
};

window.switchView = function(viewId, navEl = null) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);

    const titleMap = {
        'view-overview': 'Tổng quan',
        'view-students': 'Học sinh',
        'view-in-class': 'Trong tiết',
        'view-gradebook': 'Sổ điểm',
        'view-statistics': 'Thống kê',
        'view-settings': 'Cài đặt'
    };
    document.getElementById('page-title').innerText = titleMap[viewId] || 'GVBM Pro';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(navEl) navEl.classList.add('active');
    
    window.refreshAllViews();
};

window.openModal = function(id) { document.getElementById(id).style.display = 'flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

// ================= TỰ ĐỘNG TÍNH TOÁN & NHẬN XÉT =================
window.calculateDTB = function(txArr, gk, ck) {
    let allGrades = [...txArr, gk, ck];
    if (allGrades.some(g => typeof g === 'string' && (g.toUpperCase() === 'Đ' || g.toUpperCase() === 'CĐ'))) {
        if (ck) return ck;
        if (gk) return gk;
        let lastTx = [...txArr].reverse().find(g => g);
        return lastTx || "";
    }

    let validTx = txArr.filter(x => x !== "" && x !== null && !isNaN(Number(x))).map(Number);
    let numGk = (gk !== "" && gk !== null && !isNaN(Number(gk))) ? Number(gk) : null;
    let numCk = (ck !== "" && ck !== null && !isNaN(Number(ck))) ? Number(ck) : null;

    if (validTx.length === 0 && numGk === null && numCk === null) return "";

    let sum = validTx.reduce((a, b) => a + b, 0);
    let count = validTx.length;

    if (numGk !== null) { sum += numGk * 2; count += 2; }
    if (numCk !== null) { sum += numCk * 3; count += 3; }

    if (count === 0) return "";
    return (sum / count).toFixed(1);
};

window.getAutoComment = function(dtb) {
    if (dtb === "" || dtb === null) return "";
    
    if (typeof dtb === 'string') {
        let d = dtb.toUpperCase();
        if (d === 'Đ' || d === 'ĐẠT') return "Đạt yêu cầu môn học.";
        if (d === 'CĐ' || d === 'CHƯA ĐẠT') return "Chưa đạt yêu cầu, cần cố gắng thêm.";
    }

    let val = Number(dtb);
    if (isNaN(val)) return "";
    
    let rules = appData.settings.commentRules || defaultCommentRules;
    for (let r of rules) {
        if (val >= r.min && val <= r.max) return r.text;
    }
    return "Cần cố gắng nhiều hơn.";
};

// ================= RENDER CÁC MÀN HÌNH =================
window.initAppUI = function() {
    window.renderClassSelector();
    window.refreshAllViews();
};

window.renderClassSelector = function() {
    const select = document.getElementById('global-class-select');
    select.innerHTML = '';
    const classList = Object.keys(appData.classes);
    if(classList.length === 0) {
        appData.classes["TOÁN HỌC - 6A"] = [];
        classList.push("TOÁN HỌC - 6A");
    }
    if(!appData.classes[appData.settings.currentClass]) {
        appData.settings.currentClass = classList[0];
    }
    classList.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c; opt.innerText = c; 
        if(c === appData.settings.currentClass) opt.selected = true;
        select.appendChild(opt);
    });
};

window.changeCurrentClass = function(newClass) {
    appData.settings.currentClass = newClass;
    window.saveData();
    window.showToast(`Đã chuyển sang ${newClass}`);
};

window.refreshAllViews = function() {
    const s = appData.settings;
    const currentList = appData.classes[s.currentClass] || [];

    let keyParts = s.currentClass.split(' - ');
    let displaySubject = keyParts.length > 1 ? keyParts[0] : s.subject;
    let displayClass = keyParts.length > 1 ? keyParts[1] : s.currentClass;

    document.getElementById('dash-teacher-name').innerText = s.teacherName;
    document.getElementById('drawer-teacher-name').innerText = s.teacherName;
    document.getElementById('drawer-subject-name').innerText = `${displaySubject} • Lớp ${displayClass}`;
    
    let parts = s.teacherName.trim().split(' ');
    let avatarText = "GV";
    if (parts.length > 0 && parts[parts.length-1]) {
        avatarText = parts[parts.length-1].substring(0,2).toUpperCase();
    }
    document.getElementById('drawer-avatar').innerText = avatarText;

    // 1. Dashboard Metrics
    const totalStudents = currentList.length;
    document.getElementById('stat-class-size').innerText = totalStudents;

    let validScores = currentList.map(st => Number(st.dtb)).filter(v => !isNaN(v) && v > 0);
    let avgScore = validScores.length > 0 ? (validScores.reduce((a,b)=>a+b, 0) / validScores.length).toFixed(1) : "0.0";
    document.getElementById('stat-class-avg').innerText = avgScore;

    let goodCount = validScores.filter(sc => sc >= 8.0).length;
    let goodRate = totalStudents > 0 ? Math.round((goodCount / totalStudents) * 100) : 0;
    document.getElementById('stat-good-rate').innerText = `${goodRate}%`;
    document.getElementById('stat-tx-count').innerText = `${s.txColumns || 4} cột`;

    // Phân bố kết quả
    let cXuatSac = validScores.filter(sc => sc >= 9.0).length;
    let cTot = validScores.filter(sc => sc >= 8.0 && sc < 9.0).length;
    let cKha = validScores.filter(sc => sc >= 6.5 && sc < 8.0).length;
    let cCanCoGang = validScores.filter(sc => sc < 6.5).length;

    document.getElementById('count-xuat-sac').innerText = cXuatSac;
    document.getElementById('count-tot').innerText = cTot;
    document.getElementById('count-kha').innerText = cKha;
    document.getElementById('count-can-co-gang').innerText = cCanCoGang;

    if (totalStudents > 0) {
        document.getElementById('bar-xuat-sac').style.width = `${(cXuatSac/totalStudents)*100}%`;
        document.getElementById('bar-tot').style.width = `${(cTot/totalStudents)*100}%`;
        document.getElementById('bar-kha').style.width = `${(cKha/totalStudents)*100}%`;
        document.getElementById('bar-can-co-gang').style.width = `${(cCanCoGang/totalStudents)*100}%`;
    }

    // Danh sách cần chú ý
    const attList = document.getElementById('attention-student-list');
    attList.innerHTML = '';
    let attentionStudents = currentList.filter(st => {
        let isLowScore = (Number(st.dtb) > 0 && Number(st.dtb) < 6.5);
        let isCD = (typeof st.dtb === 'string' && st.dtb.toUpperCase() === 'CĐ');
        return isLowScore || isCD || (st.violationCount > 0);
    });
    
    if (attentionStudents.length === 0) {
        attList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 15px;">Lớp đang học tập rất tốt! 🎉</div>`;
    } else {
        attentionStudents.slice(0, 5).forEach(st => {
            let initials = st.name.split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase();
            let isDanger = (Number(st.dtb) > 0 && Number(st.dtb) < 5.0) || (typeof st.dtb === 'string' && st.dtb.toUpperCase() === 'CĐ');
            let scoreClass = isDanger ? 'danger' : 'warn';
            attList.innerHTML += `
                <div class="attention-item" onclick="openStudentProfile(${st.id})">
                    <div class="att-left">
                        <div class="avatar-circle-sm">${initials}</div>
                        <div class="att-info">
                            <strong>${st.name}</strong>
                            <span>${st.violationCount || 0} lần vi phạm • ${st.callCount || 0} lần gọi</span>
                        </div>
                    </div>
                    <span class="score-pill ${scoreClass}">${st.dtb || '--'}</span>
                </div>
            `;
        });
    }

    if(document.getElementById('stat-view-classname')) document.getElementById('stat-view-classname').innerText = displayClass;
    if(document.getElementById('stat-view-subject')) document.getElementById('stat-view-subject').innerText = displaySubject;
    if(document.getElementById('stat-view-year')) document.getElementById('stat-view-year').innerText = s.year;
    if(document.getElementById('stat-total-stu')) document.getElementById('stat-total-stu').innerText = totalStudents;
    if(document.getElementById('stat-avg-all')) document.getElementById('stat-avg-all').innerText = avgScore;
    
    let maxS = validScores.length > 0 ? Math.max(...validScores) : 0;
    let minS = validScores.length > 0 ? Math.min(...validScores) : 0;
    if(document.getElementById('stat-max-score')) document.getElementById('stat-max-score').innerText = maxS;
    if(document.getElementById('stat-min-score')) document.getElementById('stat-min-score').innerText = minS;

    window.renderStudentsView();
    window.renderGradebookTable();
    window.renderInClassView();

    document.getElementById('set-teacher-name').value = s.teacherName || '';
    document.getElementById('set-subject-name').value = s.subject || '';
    document.getElementById('set-school-year').value = s.year || '';
    document.getElementById('set-semester').value = s.semester || 'HK1';
    window.renderCommentRulesSettings();
};

// ================= RENDER DANH SÁCH HỌC SINH =================
window.renderStudentsView = function() {
    const listEl = document.getElementById('students-card-list');
    if(!listEl) return;
    listEl.innerHTML = '';
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const searchTxt = (document.getElementById('search-student-input')?.value || '').toLowerCase();

    let filtered = currentList.filter(s => s.name.toLowerCase().includes(searchTxt));
    if(filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">Không tìm thấy học sinh nào.</div>`;
        return;
    }

    filtered.forEach((st, idx) => {
        let initials = st.name.split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase();
        
        let evalBadge = 'good';
        if (typeof st.dtb === 'string') {
            let d = st.dtb.toUpperCase();
            if (d === 'CĐ' || d === 'CHƯA ĐẠT') evalBadge = 'danger';
            else if (d !== 'Đ' && d !== 'ĐẠT' && isNaN(Number(d))) evalBadge = 'warn'; 
        } else {
            let dtb = Number(st.dtb) || 0;
            evalBadge = dtb >= 8 ? 'good' : (dtb >= 5 ? 'warn' : 'danger');
        }
        if (st.dtb === "" || st.dtb === null) evalBadge = 'warn'; 

        listEl.innerHTML += `
            <div class="stat-card-modern" style="cursor: pointer;" onclick="openStudentProfile(${st.id})">
                <div class="avatar-circle-sm">${initials}</div>
                <div style="flex: 1;">
                    <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${idx + 1}. ${st.name}</strong>
                    <small style="color: var(--text-muted);">${st.dob || 'Chưa có ngày sinh'} • Gọi: ${st.callCount || 0} • Lỗi: ${st.violationCount || 0}</small>
                </div>
                <span class="score-pill ${evalBadge}">${st.dtb || '--'}</span>
            </div>
        `;
    });
};

// ================= HỒ SƠ HỌC SINH (MODAL PROFILE) =================
let editingStudentId = null;
window.openStudentProfile = function(id) {
    editingStudentId = id;
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const st = currentList.find(x => x.id === id);
    if (!st) return;

    const stt = currentList.findIndex(x => x.id === id) + 1;
    let keyParts = appData.settings.currentClass.split(' - ');
    let displayClass = keyParts.length > 1 ? keyParts[1] : appData.settings.currentClass;

    document.getElementById('prof-student-id').value = st.id;
    document.getElementById('prof-header-name').innerText = st.name;
    document.getElementById('prof-name').value = st.name;
    document.getElementById('prof-header-class').innerText = displayClass;
    document.getElementById('prof-header-stt').innerText = stt;
    document.getElementById('prof-header-dtb').innerText = st.dtb || '--';
    document.getElementById('prof-avatar').innerText = st.name.split(' ').map(n=>n[0]).slice(-2).join('').toUpperCase();

    document.getElementById('prof-calls').innerText = st.callCount || 0;
    document.getElementById('prof-violations').innerText = st.violationCount || 0;

    const txContainer = document.getElementById('prof-tx-container');
    txContainer.innerHTML = '';
    const numCols = appData.settings.txColumns || 4;
    for(let i=0; i<numCols; i++) {
        let val = st.tx && st.tx[i] !== undefined ? st.tx[i] : '';
        txContainer.innerHTML += `
            <div class="tx-box">
                <span>TX${i+1}</span>
                <input type="text" class="prof-tx-input" data-idx="${i}" value="${val}" oninput="recalcProfileScores()">
            </div>
        `;
    }

    document.getElementById('prof-gk').value = st.gk !== undefined ? st.gk : '';
    document.getElementById('prof-ck').value = st.ck !== undefined ? st.ck : '';
    document.getElementById('prof-dtb').value = st.dtb || '';
    document.getElementById('prof-comment').value = st.comment || '';

    window.recalcProfileScores();
    window.openModal('modal-student-profile');
};

window.stepCounter = function(elementId, delta) {
    const el = document.getElementById(elementId);
    let val = Math.max(0, parseInt(el.innerText || 0) + delta);
    el.innerText = val;
};

window.recalcProfileScores = function() {
    let txInputs = document.querySelectorAll('.prof-tx-input');
    let txArr = Array.from(txInputs).map(inp => inp.value);
    let gk = document.getElementById('prof-gk').value;
    let ck = document.getElementById('prof-ck').value;

    let dtb = window.calculateDTB(txArr, gk, ck);
    document.getElementById('prof-dtb').value = dtb;
    document.getElementById('prof-header-dtb').innerText = dtb || '--';

    let autoComment = window.getAutoComment(dtb);
    if(autoComment) {
        document.getElementById('prof-comment').value = autoComment;
    }
};

window.saveStudentProfile = function() {
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const st = currentList.find(x => x.id === editingStudentId);
    if(!st) return;

    st.name = document.getElementById('prof-name').value.trim();
    st.callCount = parseInt(document.getElementById('prof-calls').innerText) || 0;
    st.violationCount = parseInt(document.getElementById('prof-violations').innerText) || 0;

    let txInputs = document.querySelectorAll('.prof-tx-input');
    st.tx = Array.from(txInputs).map(inp => inp.value !== "" ? (isNaN(Number(inp.value)) ? inp.value : Number(inp.value)) : "");
    st.gk = document.getElementById('prof-gk').value !== "" ? (isNaN(Number(document.getElementById('prof-gk').value)) ? document.getElementById('prof-gk').value : Number(document.getElementById('prof-gk').value)) : "";
    st.ck = document.getElementById('prof-ck').value !== "" ? (isNaN(Number(document.getElementById('prof-ck').value)) ? document.getElementById('prof-ck').value : Number(document.getElementById('prof-ck').value)) : "";
    st.dtb = document.getElementById('prof-dtb').value;
    st.comment = document.getElementById('prof-comment').value.trim();

    window.saveData();
    window.closeModal('modal-student-profile');
    window.showToast("✅ Đã lưu hồ sơ học sinh thành công!");
};

// ================= RENDER SỔ ĐIỂM (GRADEBOOK TABLE) =================
window.renderGradebookTable = function() {
    const tbody = document.getElementById('score-table-body');
    const theadRow = document.getElementById('score-table-header');
    if(!tbody || !theadRow) return;

    const numTx = appData.settings.txColumns || 4;
    let headerHtml = `<th>STT</th><th class="text-left">Họ và tên</th>`;
    for(let i=1; i<=numTx; i++) headerHtml += `<th>TX${i}</th>`;
    headerHtml += `<th>GK</th><th>CK</th><th>ĐTB</th><th class="text-left">Nhận xét</th>`;
    theadRow.innerHTML = headerHtml;

    tbody.innerHTML = '';
    const currentList = appData.classes[appData.settings.currentClass] || [];

    currentList.forEach((st, idx) => {
        let tr = document.createElement('tr');
        let txCells = '';
        for(let i=0; i<numTx; i++) {
            let val = (st.tx && st.tx[i] !== undefined) ? st.tx[i] : '';
            txCells += `<td><input type="text" class="score-input" value="${val}" onchange="quickUpdateScore(${st.id}, 'tx', ${i}, this.value)"></td>`;
        }

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td class="text-left"><strong style="cursor:pointer; color:var(--primary);" onclick="openStudentProfile(${st.id})">${st.name}</strong></td>
            ${txCells}
            <td><input type="text" class="score-input" value="${st.gk !== undefined ? st.gk : ''}" onchange="quickUpdateScore(${st.id}, 'gk', 0, this.value)"></td>
            <td><input type="text" class="score-input" value="${st.ck !== undefined ? st.ck : ''}" onchange="quickUpdateScore(${st.id}, 'ck', 0, this.value)"></td>
            <td><strong style="color:var(--primary);">${st.dtb || '--'}</strong></td>
            <td class="text-left"><input type="text" value="${st.comment || ''}" style="width:160px; padding:4px 8px; border:1px solid #cbd5e1; border-radius:6px; font-weight:600; font-size:0.8rem;" onchange="quickUpdateScore(${st.id}, 'comment', 0, this.value)"></td>
        `;
        tbody.appendChild(tr);
    });
};

window.quickUpdateScore = function(studentId, field, txIdx, value) {
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const st = currentList.find(x => x.id === studentId);
    if(!st) return;

    if (field === 'tx') {
        if(!st.tx) st.tx = [];
        st.tx[txIdx] = value.trim() !== "" ? (isNaN(Number(value)) ? value : Number(value)) : "";
    } else if (field === 'gk') {
        st.gk = value.trim() !== "" ? (isNaN(Number(value)) ? value : Number(value)) : "";
    } else if (field === 'ck') {
        st.ck = value.trim() !== "" ? (isNaN(Number(value)) ? value : Number(value)) : "";
    } else if (field === 'comment') {
        st.comment = value.trim();
    }

    st.dtb = window.calculateDTB(st.tx || [], st.gk, st.ck);
    if (field !== 'comment') {
        st.comment = window.getAutoComment(st.dtb);
    }

    window.saveData();
};

window.addNewTxColumn = function() {
    appData.settings.txColumns = (appData.settings.txColumns || 4) + 1;
    window.saveData();
    window.showToast(`Đã thêm cột TX${appData.settings.txColumns}!`);
};

// ================= ĐỒNG BỘ & XUẤT FILE EDU =================
window.triggerEduImport = function() {
    document.getElementById('edu-import-input').click();
};

window.handleEduImportFile = function(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            let totalImportedCount = 0;

            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                if(rows.length < 7) return;

                let targetClass = "CHUNG";
                let classRowStr = (rows[3] || []).join(' ');
                let classMatch = classRowStr.match(/Lớp\s*([0-9]+[A-Za-z0-9]*)/i);
                if (classMatch && classMatch[1]) {
                    targetClass = classMatch[1].toUpperCase();
                } else if (sheetName.includes('_')) {
                    let parts = sheetName.split('_');
                    targetClass = parts[parts.length - 1].toUpperCase();
                }

                let targetSubject = appData.settings.subject.toUpperCase();
                let subjectRowStr = (rows[2] || []).join(' ');
                let subjectMatch = subjectRowStr.match(/MÔN\s+([^-]+)\s+-/i);
                if (subjectMatch && subjectMatch[1]) {
                    targetSubject = subjectMatch[1].trim().toUpperCase();
                }

                let listKey = `${targetSubject} - ${targetClass}`;

                if (!appData.classes[listKey]) appData.classes[listKey] = [];
                let classList = appData.classes[listKey];

                for (let r = 7; r < rows.length; r++) {
                    let row = rows[r];
                    let stt = row[0];
                    if (!stt || isNaN(parseInt(stt))) continue;

                    let maHs = String(row[1]).trim();
                    let hoDem = String(row[2]).trim();
                    let ten = String(row[3]).trim();
                    let fullName = `${hoDem} ${ten}`.trim();
                    let dob = String(row[4]).trim();

                    let tx1 = row[5], tx2 = row[6], tx3 = row[7], tx4 = row[8];
                    let gk = row[9], ck = row[10], dtb = row[11], comment = String(row[12]).trim();

                    let existing = classList.find(x => x.maHs === maHs || (maHs && x.maHs == maHs));
                    if (existing) {
                        existing.hoDem = hoDem; existing.ten = ten; existing.name = fullName; existing.dob = dob;
                        existing.tx = [tx1, tx2, tx3, tx4].filter(x => x !== "");
                        existing.gk = gk; existing.ck = ck; existing.dtb = dtb;
                        existing.comment = comment || window.getAutoComment(dtb);
                    } else {
                        classList.push({
                            id: Date.now() + Math.random(),
                            maHs: maHs,
                            hoDem: hoDem,
                            ten: ten,
                            name: fullName,
                            dob: dob,
                            gender: "Nam",
                            tx: [tx1, tx2, tx3, tx4].filter(x => x !== ""),
                            gk: gk,
                            ck: ck,
                            dtb: dtb,
                            comment: comment || window.getAutoComment(dtb),
                            callCount: 0,
                            violationCount: 0
                        });
                    }
                    totalImportedCount++;
                }
            });

            window.renderClassSelector();
            
            if (!appData.classes[appData.settings.currentClass]) {
                 appData.settings.currentClass = Object.keys(appData.classes)[0];
                 document.getElementById('global-class-select').value = appData.settings.currentClass;
            }

            window.saveData();
            window.showToast(`🎉 Đồng bộ EDU thành công ${totalImportedCount} học sinh!`);
        } catch (error) {
            console.error(error);
            window.showToast("Lỗi cấu trúc file EDU!", "error");
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
};

window.exportEduFile = function() {
    const s = appData.settings;
    const currentList = appData.classes[s.currentClass] || [];
    if(currentList.length === 0) return window.showToast("Lớp chưa có dữ liệu!", "error");

    let keyParts = s.currentClass.split(' - ');
    let expSubject = keyParts.length > 1 ? keyParts[0] : s.subject.toUpperCase();
    let expClass = keyParts.length > 1 ? keyParts[1] : s.currentClass;

    let ws_data = [
        ["ỦY BAN NHÂN DÂN PHƯỜNG TĨNH GIA"],
        ["TRƯỜNG TH & THCS LƯƠNG CHÍ"],
        [`BẢNG ĐIỂM CHI TIẾT - MÔN ${expSubject} - ${s.semester.toUpperCase()} - NĂM HỌC ${s.year}`],
        [`Khối ${expClass.replace(/[^0-9]/g, '')} - Lớp ${expClass}`],
        [],
        ["STT", "Mã học sinh", "Họ và tên", "", "Ngày sinh", "ĐĐGtx", "", "", "ĐĐGtx", "ĐĐGgk", "ĐĐGck", "ĐTB \nmhk", "Nhận xét"],
        ["", "", "", "", "", "TX1", "TX2", "TX3", "TX4", "GK1", "CK1", "", ""]
    ];

    currentList.forEach((st, idx) => {
        let tx = st.tx || [];
        ws_data.push([
            idx + 1,
            st.maHs || "",
            st.hoDem || st.name.split(' ').slice(0, -1).join(' '),
            st.ten || st.name.split(' ').pop(),
            st.dob || "",
            tx[0] !== undefined ? tx[0] : "",
            tx[1] !== undefined ? tx[1] : "",
            tx[2] !== undefined ? tx[2] : "",
            tx[3] !== undefined ? tx[3] : "",
            st.gk !== undefined ? st.gk : "",
            st.ck !== undefined ? st.ck : "",
            st.dtb !== undefined ? st.dtb : "",
            st.comment || ""
        ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, `so_diem_${expClass}`);
    XLSX.writeFile(wb, `So_Diem_${expSubject}_${expClass}.xlsx`);
    window.showToast("✅ Đã xuất File EDU thành công!");
};

// ================= TRONG TIẾT =================
let lastPickedStudent = null;
window.pickRandomStudent = function() {
    const currentList = appData.classes[appData.settings.currentClass] || [];
    if(currentList.length === 0) return window.showToast("Lớp trống!", "error");

    const display = document.getElementById('random-picker-display');
    let count = 0;
    let interval = setInterval(() => {
        let randomStu = currentList[Math.floor(Math.random() * currentList.length)];
        display.innerText = randomStu.name;
        count++;
        if(count > 15) {
            clearInterval(interval);
            lastPickedStudent = randomStu;
            document.getElementById('btn-plus-call').style.display = 'inline-flex';
        }
    }, 80);
};

window.confirmAddCall = function() {
    if(!lastPickedStudent) return;
    lastPickedStudent.callCount = (lastPickedStudent.callCount || 0) + 1;
    window.saveData();
    document.getElementById('btn-plus-call').style.display = 'none';
    window.showToast(`Đã +1 lần gọi cho em ${lastPickedStudent.name}!`);
};

window.renderInClassView = function() {
    const listEl = document.getElementById('in-class-student-list');
    if(!listEl) return;
    listEl.innerHTML = '';
    const currentList = appData.classes[appData.settings.currentClass] || [];

    currentList.forEach(st => {
        listEl.innerHTML += `
            <div class="attention-item">
                <div>
                    <strong>${st.name}</strong>
                    <small style="color:var(--text-muted); display:block;">Gọi: ${st.callCount || 0} • Vi phạm: ${st.violationCount || 0}</small>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-outline" style="padding: 6px 10px; color: var(--success);" onclick="quickAddPlusPoint(${st.id})">+1 Điểm tốt</button>
                    <button class="btn-outline" style="padding: 6px 10px; color: var(--danger);" onclick="quickAddViolation(${st.id})">+1 Vi phạm</button>
                </div>
            </div>
        `;
    });
};

window.quickAddViolation = function(id) {
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const st = currentList.find(x => x.id === id);
    if(st) {
        st.violationCount = (st.violationCount || 0) + 1;
        window.saveData();
        window.showToast(`Đã ghi nhận 1 vi phạm cho em ${st.name}`);
    }
};

window.quickAddPlusPoint = function(id) {
    const currentList = appData.classes[appData.settings.currentClass] || [];
    const st = currentList.find(x => x.id === id);
    if(st) {
        st.callCount = (st.callCount || 0) + 1;
        window.saveData();
        window.showToast(`Đã ghi nhận phát biểu cho em ${st.name}`);
    }
};

// ================= CÀI ĐẶT & BẢO TRÌ DỮ LIỆU =================
window.renderCommentRulesSettings = function() {
    const container = document.getElementById('comment-rules-container');
    if(!container) return;
    container.innerHTML = '';
    const rules = appData.settings.commentRules || defaultCommentRules;

    rules.forEach((r, idx) => {
        container.innerHTML += `
            <div style="display: flex; gap: 8px; align-items: center; background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <input type="number" value="${r.min}" step="0.1" style="width: 55px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; text-align: center;" onchange="updateCommentRule(${idx}, 'min', this.value)">
                <span>-</span>
                <input type="number" value="${r.max}" step="0.1" style="width: 55px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; text-align: center;" onchange="updateCommentRule(${idx}, 'max', this.value)">
                <input type="text" value="${r.text}" style="flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; font-size: 0.85rem;" onchange="updateCommentRule(${idx}, 'text', this.value)">
                <button class="btn-icon" style="width: 32px; height: 32px; color: var(--danger);" onclick="deleteCommentRule(${idx})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
};

window.updateCommentRule = function(idx, field, val) {
    if (field === 'min' || field === 'max') {
        appData.settings.commentRules[idx][field] = Number(val);
    } else {
        appData.settings.commentRules[idx].text = val.trim();
    }
    window.saveData();
};

window.addNewCommentRule = function() {
    if(!appData.settings.commentRules) appData.settings.commentRules = [];
    appData.settings.commentRules.push({ min: 0, max: 10, text: "Nhận xét mới..." });
    window.saveData();
};

window.deleteCommentRule = function(idx) {
    appData.settings.commentRules.splice(idx, 1);
    window.saveData();
};

window.resetDefaultCommentRules = function() {
    if(confirm("Khôi phục toàn bộ bảng nhận xét mặc định của Bộ GDĐT?")) {
        appData.settings.commentRules = JSON.parse(JSON.stringify(defaultCommentRules));
        window.saveData();
        window.showToast("Đã khôi phục mẫu mặc định!");
    }
};

window.saveTeacherSettings = function() {
    appData.settings.teacherName = document.getElementById('set-teacher-name').value.trim();
    appData.settings.subject = document.getElementById('set-subject-name').value.trim();
    appData.settings.year = document.getElementById('set-school-year').value.trim();
    appData.settings.semester = document.getElementById('set-semester').value;
    window.saveData();
    window.showToast("✅ Đã lưu cấu hình giảng dạy!");
};

window.confirmAddNewStudent = function() {
    const name = document.getElementById('add-stu-name').value.trim();
    if(!name) return window.showToast("Vui lòng nhập tên học sinh!", "error");

    const dob = document.getElementById('add-stu-dob').value.trim();
    const gender = document.getElementById('add-stu-gender').value;

    const currentList = appData.classes[appData.settings.currentClass] || [];
    currentList.push({
        id: Date.now(),
        maHs: "",
        name: name,
        dob: dob,
        gender: gender,
        tx: [],
        gk: "",
        ck: "",
        dtb: "",
        comment: "",
        callCount: 0,
        violationCount: 0
    });

    window.saveData();
    window.closeModal('modal-add-student');
    document.getElementById('add-stu-name').value = '';
    window.showToast(`Đã thêm em ${name}!`);
};

window.backupAppDataJSON = function() {
    let dataStr = JSON.stringify(appData);
    let blob = new Blob([dataStr], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `DuLieu_GVBM_${appData.settings.year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast("Đã tải bản sao lưu dữ liệu!");
};

window.resetData = function() {
    if(confirm("XÓA SẠCH DỮ LIỆU CÁC LỚP? Thao tác này sẽ xóa vĩnh viễn dữ liệu trên máy và trên Đám mây để bạn nhập lại từ đầu.")) {
        appData.classes = {};
        appData.settings.currentClass = "";
        
        localStorage.setItem('gvbmData_v1', JSON.stringify(appData));
        
        if (currentUser) {
            const docRef = doc(firestoreDb, "DuLieuGVBM", currentUser.uid);
            setDoc(docRef, appData).then(() => {
                window.showToast("Đã dọn dẹp sạch sẽ!", "success");
                setTimeout(() => location.reload(), 1000);
            }).catch(e => {
                console.error("Lỗi dọn dẹp:", e);
                location.reload();
            });
        } else {
            location.reload();
        }
    }
};

window.onload = () => {
    window.initAppUI();
};