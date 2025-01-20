import React, { useState, useEffect } from "react";
import "./InfoPanel.css";

const InfoPanel = ({ visible, objectData, activeMenu, onUpdate, onDelete }) => {
    const [localData, setLocalData] = useState(objectData?.data || {});

    useEffect(() => {
        if (objectData?.data) {
            setLocalData(objectData.data);
        }
    }, [objectData]);

    if (!visible || !localData) return null;

    const handleInputChange = (key, value) => {
        setLocalData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handlePropertyChange = (key, value) => {
        setLocalData((prev) => ({
            ...prev,
            property: prev.property.map((prop) =>
                prop.key === key ? { ...prop, doubleValue: parseFloat(value) } : prop
            ),
        }));
    };

    const handleSave = () => {
        console.log("Saving object:", { ...objectData, data: localData }); // 디버그 출력
        if (onUpdate) {
            onUpdate({ ...objectData, data: localData });
        }
    };

    const handleDelete = () => {
        console.log("Deleting object:", objectData); // 디버그 출력
        if (onDelete) {
            onDelete(objectData);
        }
    };



    const renderStationForm = (station) => (
        <div className="info-panel-content">
            <div className="property-row">
                <label className="property-key">Instance Name</label>
                <input
                    className="property-input"
                    type="text"
                    value={station.instanceName || ""}
                    readOnly
                />
            </div>
            <div className="property-row">
                <label className="property-key">Position X</label>
                <input
                    className="property-input"
                    type="number"
                    value={station.pos?.x || ""}
                    onChange={(e) =>
                        handleInputChange("pos", {
                            ...station.pos,
                            x: parseFloat(e.target.value) || 0,
                        })
                    }
                />
            </div>
            <div className="property-row">
                <label className="property-key">Position Y</label>
                <input
                    className="property-input"
                    type="number"
                    value={station.pos?.y || ""}
                    onChange={(e) =>
                        handleInputChange("pos", {
                            ...station.pos,
                            y: parseFloat(e.target.value) || 0,
                        })
                    }
                />
            </div>
            <div className="property-row">
                <label className="property-key">Direction</label>
                <input
                    className="property-input"
                    type="number"
                    value={station.dir || ""}
                    onChange={(e) => handleInputChange("dir", parseFloat(e.target.value) || 0)}
                />
            </div>
        </div>
    );

    const renderPathForm = (path) => (
        <div className="info-panel-content">
            <div className="property-row">
                <label className="property-key">Instance Name</label>
                <input
                    className="property-input"
                    type="text"
                    value={path.instanceName || ""}
                    readOnly
                />
            </div>
            <div className="property-row">
                <label className="property-key">Max Speed</label>
                <input
                    className="property-input"
                    type="number"
                    value={
                        path.property?.find((p) => p.key === "maxspeed")?.doubleValue || ""
                    }
                    onChange={(e) =>
                        handlePropertyChange("maxspeed", parseFloat(e.target.value) || 0)
                    }
                />
            </div>
            <div className="property-row">
                <label className="property-key">Max Deceleration</label>
                <input
                    className="property-input"
                    type="number"
                    value={
                        path.property?.find((p) => p.key === "maxdec")?.doubleValue || ""
                    }
                    onChange={(e) =>
                        handlePropertyChange("maxdec", parseFloat(e.target.value) || 0)
                    }
                />
            </div>
        </div>
    );

    let content;
    if (objectData.type === "advancedPoint") {
        content = renderStationForm(localData);
    } else if (objectData.type === "advancedCurve") {
        content = renderPathForm(localData);
    } else {
        content = <div className="info-panel-content">Unknown object type</div>;
    }

    return (
        <div className="info-panel-container">
            <div className="info-panel-header">
                <span className="info-panel-title">
                    {objectData.type === "advancedPoint" ? "Station 정보" : "Path 정보"}{" "}
                    {activeMenu === 1 ? "(SLAM 진행 중)" : ""}
                </span>
            </div>
            <div className="info-panel-divider" />
            {content}
            <div className="info-panel-actions">
                <button className="info-panel-button save" onClick={handleSave}>
                    저장
                </button>
                <button className="info-panel-button delete" onClick={handleDelete}>
                    삭제
                </button>
            </div>
        </div>
    );
};

export default InfoPanel;

