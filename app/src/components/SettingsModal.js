import React, { useState, useEffect } from "react";
import "./SettingsModal.css";

const SettingsModal = ({ isOpen, onClose, onSave }) => {
    const [amrIp, setAmrIp] = useState("");

    useEffect(() => {
        // 저장된 AMR IP 불러오기
        const savedAmrIp = localStorage.getItem("amrIp");
        if (savedAmrIp) {
            setAmrIp(savedAmrIp);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("amrIp", amrIp); // AMR IP 저장
        onSave(amrIp);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="settings-modal">
            <div className="settings-modal-content">
                <h2>설정</h2>
                <label>
                    AMR IP:
                    <input
                        type="text"
                        value={amrIp}
                        onChange={(e) => setAmrIp(e.target.value)}
                        placeholder="192.168.x.x"
                    />
                </label>
                <div className="modal-actions">
                    <button onClick={handleSave}>저장</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
