import React, { useState } from "react";
import "./PathModal.css";

const PathModal = ({ isOpen, onClose, onSubmit, advancedPointList }) => {
    const [startPos, setStartPos] = useState("");
    const [stopPos, setStopPos] = useState("");

    const handleSubmit = () => {
        if (startPos && stopPos && startPos !== stopPos) {
            const startStation = advancedPointList.find((p) => p.instanceName === startPos);
            const stopStation = advancedPointList.find((p) => p.instanceName === stopPos);

            if (startStation && stopStation) {
                onSubmit(startStation, stopStation); // 부모 컴포넌트로 데이터 전달
                onClose(); // 모달 닫기
            } else {
                alert("유효하지 않은 스테이션을 선택했습니다.");
            }
        } else {
            alert("Start와 Stop 포지션을 올바르게 선택해주세요.");
        }
    };

    if (!isOpen) {
        console.log("PathModal is not open"); // 디버그 로그 추가
        return null;
    }


    return (
        <div className="modal">
            <div className="modal-content">
                <h2>경로 추가</h2>
                <label>
                    Start Position:
                    <select value={startPos} onChange={(e) => setStartPos(e.target.value)}>
                        <option value="">Select Start Position</option>
                        {advancedPointList.map((point) => (
                            <option key={point.instanceName} value={point.instanceName}>
                                {point.instanceName}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Stop Position:
                    <select value={stopPos} onChange={(e) => setStopPos(e.target.value)}>
                        <option value="">Select Stop Position</option>
                        {advancedPointList.map((point) => (
                            <option key={point.instanceName} value={point.instanceName}>
                                {point.instanceName}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="modal-actions">
                    <button onClick={handleSubmit}>추가</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
};

export default PathModal;
