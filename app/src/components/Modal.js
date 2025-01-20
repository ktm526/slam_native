import React from "react";
import "./Modal.css"; // 스타일링 필요

const Modal = ({ isOpen, onClose, onSubmit }) => {
    const [x, setX] = React.useState("");
    const [y, setY] = React.useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        const mapX = parseFloat(x);
        const mapY = parseFloat(y);

        if (isNaN(mapX) || isNaN(mapY)) {
            alert("Invalid input! Please enter numeric values.");
            return;
        }

        onSubmit(mapX, mapY); // 부모 컴포넌트에 좌표 전달
        onClose(); // 모달 닫기
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Enter Coordinates</h2>
                <div>
                    <label>
                        X Position:
                        <input
                            type="text"
                            value={x}
                            onChange={(e) => setX(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Y Position:
                        <input
                            type="text"
                            value={y}
                            onChange={(e) => setY(e.target.value)}
                        />
                    </label>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
