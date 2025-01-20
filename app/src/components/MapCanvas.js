import React, { useRef, useEffect, useState } from "react";

const MapCanvas = ({ mapData, onObjectClick, activeMenu, amrPosition }) => {
    const canvasRef = useRef(null);

    // 확대/축소 비율 & 오프셋
    const [scale, setScale] = useState(40);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Hover 중인 오브젝트
    const [hoveredObject, setHoveredObject] = useState(null);

    // 클릭된 오브젝트
    const [clickedObject, setClickedObject] = useState(null);

    // 맵 좌표 영역
    const minPos = useRef(mapData.header.minPos);
    const maxPos = useRef(mapData.header.maxPos);

    // Canvas 실제 픽셀 크기
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    useEffect(() => {
        console.log('MapCanvas Received Map Data:', mapData); // mapData를 확인
    }, [mapData]);

    useEffect(() => {
        if (activeMenu === 0) {
            // 실시간 위치 업데이트 로직 추가
            console.log("실시간 위치 활성화");
        } else if (activeMenu === 1) {
            // SLAM 진행 로직 추가
            console.log("SLAM 진행 활성화");
        }
    }, [activeMenu]);
    // Canvas 크기 동기화
    useEffect(() => {
        const canvas = canvasRef.current;

        function handleResize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            setCanvasSize({
                width: canvas.width,
                height: canvas.height,
            });
        }

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // (맵 좌표)→(화면 픽셀) 변환 함수
    const transformCoordinates = (mapX, mapY) => {
        const { width, height } = canvasSize;

        const ratioX = (mapX - minPos.current.x) / (maxPos.current.x - minPos.current.x);
        const ratioY = (mapY - minPos.current.y) / (maxPos.current.y - minPos.current.y);

        const screenX = ratioX * (width * scale) + offset.x;
        const screenY = ratioY * (height * scale) + offset.y;
        return { x: screenX, y: screenY };
    };

    // 마우스 이벤트로부터 "캔버스 내부 픽셀 좌표" 구하기
    const getCanvasMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        return { x, y };
    };

    // 클릭 핸들러: 오브젝트 HitTest
    const handleCanvasClick = (e) => {
        e.preventDefault();
        const { x, y } = getCanvasMousePos(e);
        const clicked = checkClickedObject(x, y);

        setClickedObject(clicked); // 클릭된 오브젝트 상태 업데이트
        if (onObjectClick) {
            onObjectClick(clicked); // 상위 콜백 호출
        }
    };

    const checkClickedObject = (mouseX, mouseY) => {
        let found = null;

        // advancedPointList 검사
        (mapData.advancedPointList || []).forEach((station) => {
            const screenPos = transformCoordinates(station.pos.x, station.pos.y);
            const dist = Math.hypot(mouseX - screenPos.x, mouseY - screenPos.y);
            if (dist < 15) {
                found = { type: "advancedPoint", data: station };
            }
        });

        // advancedCurveList 검사 (베지어 곡선)
        if (!found) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            (mapData.advancedCurveList || []).forEach((curve) => {
                const start = transformCoordinates(curve.startPos.pos.x, curve.startPos.pos.y);
                const c1 = transformCoordinates(curve.controlPos1.x, curve.controlPos1.y);
                const c2 = transformCoordinates(curve.controlPos2.x, curve.controlPos2.y);
                const end = transformCoordinates(curve.endPos.pos.x, curve.endPos.pos.y);

                const path = new Path2D();
                path.moveTo(start.x, start.y);
                path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);

                ctx.save();
                ctx.lineWidth = 10;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                const hit = ctx.isPointInStroke(path, mouseX, mouseY);
                ctx.restore();

                if (hit) {
                    found = { type: "advancedCurve", data: curve };
                }
            });
        }

        return found;
    };

    // 마우스 이동 핸들러: Hover 검사
    const handleMouseMove = (e) => {
        const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

        let hovered = null;

        // advancedPointList 검사
        (mapData.advancedPointList || []).forEach((station) => {
            const screenPos = transformCoordinates(station.pos.x, station.pos.y);
            const dist = Math.hypot(mouseX - screenPos.x, mouseY - screenPos.y);
            if (dist < 15) {
                hovered = { type: "advancedPoint", data: station };
            }
        });

        // advancedCurveList 검사
        if (!hovered) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            (mapData.advancedCurveList || []).forEach((curve) => {
                const start = transformCoordinates(curve.startPos.pos.x, curve.startPos.pos.y);
                const c1 = transformCoordinates(curve.controlPos1.x, curve.controlPos1.y);
                const c2 = transformCoordinates(curve.controlPos2.x, curve.controlPos2.y);
                const end = transformCoordinates(curve.endPos.pos.x, curve.endPos.pos.y);

                const path = new Path2D();
                path.moveTo(start.x, start.y);
                path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);

                ctx.save();
                ctx.lineWidth = 10;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                const hit = ctx.isPointInStroke(path, mouseX, mouseY);
                ctx.restore();

                if (hit) {
                    hovered = { type: "advancedCurve", data: curve };
                }
            });
        }

        setHoveredObject(hovered);
    };

    // 실제 그리기
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const { width, height } = canvasSize;
        ctx.clearRect(0, 0, width, height);

        // 기본 그리기 (파란 점, 보라색 선, 빨간 베지어)
        ctx.fillStyle = "black";
        (mapData.normalPosList || []).forEach((pos) => {
            const { x, y } = transformCoordinates(pos.x, pos.y);
            ctx.fillRect(x - 1, y - 1, 2, 2);
        });

        ctx.strokeStyle = "pink";
        ctx.lineWidth = 1;
        (mapData.advancedLineList || []).forEach((lineData) => {
            const start = transformCoordinates(
                lineData.line.startPos.x,
                lineData.line.startPos.y
            );
            const end = transformCoordinates(
                lineData.line.endPos.x,
                lineData.line.endPos.y
            );
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        (mapData.advancedCurveList || []).forEach((curveData) => {
            const start = transformCoordinates(
                curveData.startPos.pos.x,
                curveData.startPos.pos.y
            );
            const c1 = transformCoordinates(curveData.controlPos1.x, curveData.controlPos1.y);
            const c2 = transformCoordinates(curveData.controlPos2.x, curveData.controlPos2.y);
            const end = transformCoordinates(curveData.endPos.pos.x, curveData.endPos.pos.y);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
            ctx.stroke();
        });

        // advancedPointList (스테이션) 그리기
        (mapData.advancedPointList || []).forEach((station) => {
            const { x, y } = transformCoordinates(station.pos.x, station.pos.y);
            const dir = station.dir;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(dir);
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 2;
            ctx.strokeRect(-40, -60, 80, 120); // 직사각형 크기 확대
            ctx.restore();

            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI); // 중심 점 크기 확대
            ctx.fill();

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(dir);
            ctx.beginPath();
            ctx.moveTo(0, -30); // 삼각형 꼭지점 크기 확대
            ctx.lineTo(-10, -20);
            ctx.lineTo(10, -20);
            ctx.closePath();
            ctx.fillStyle = "orange";
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = "black";
            ctx.font = "20px Arial"; // 글씨 크기 조정
            ctx.textAlign = "center";
            ctx.fillText(station.instanceName, x, y + 100); // 이름 위치 조정

        });

        // Hover 및 클릭된 오브젝트 강조
        const highlightObject = (object) => {
            if (!object) return;

            const ctx = canvasRef.current.getContext("2d");
            if (object.type === "advancedPoint") {
                const { x, y } = transformCoordinates(object.data.pos.x, object.data.pos.y);
                const dir = object.data.dir;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(dir);
                ctx.shadowColor = "rgba(255, 165, 0, 0.8)"; // 네온 효과 색상
                ctx.shadowBlur = 25; // 네온 효과 강도
                ctx.strokeStyle = "orange";
                ctx.lineWidth = 4;
                ctx.strokeRect(-40, -60, 80, 120); // 직사각형 크기 확대
                ctx.restore();

            } else if (object.type === "advancedCurve") {
                const curve = object.data;
                const start = transformCoordinates(curve.startPos.pos.x, curve.startPos.pos.y);
                const c1 = transformCoordinates(curve.controlPos1.x, curve.controlPos1.y);
                const c2 = transformCoordinates(curve.controlPos2.x, curve.controlPos2.y);
                const end = transformCoordinates(curve.endPos.pos.x, curve.endPos.pos.y);

                ctx.save();
                ctx.shadowColor = "rgba(255, 5, 0, 0.8)";
                ctx.shadowBlur = 20;
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
                ctx.stroke();
                ctx.restore();
            }
        };

        highlightObject(hoveredObject);
        highlightObject(clickedObject);

        // AMR 위치 (삼각형) 그리기
        if (amrPosition) {
            const { x, y, angle } = amrPosition;
            const { x: screenX, y: screenY } = transformCoordinates(x, y);

            ctx.save();
            ctx.translate(screenX, screenY); // AMR 위치로 이동
            ctx.rotate(angle); // 방향에 따라 회전
            ctx.fillStyle = "blue";

            // 삼각형 그리기
            ctx.beginPath();
            ctx.moveTo(0, -10); // 꼭짓점 (앞쪽)
            ctx.lineTo(-8, 10); // 왼쪽
            ctx.lineTo(8, 10); // 오른쪽
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }, [mapData, scale, offset, canvasSize, hoveredObject, clickedObject, amrPosition]);

    // 마우스 휠 줌
    const handleWheel = (e) => {
        e.preventDefault();

        const { width, height } = canvasSize;
        const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

        const zoomFactor = 1.1;
        const ratioX = (mouseX - offset.x) / (width * scale);
        const ratioY = (mouseY - offset.y) / (height * scale);

        const realMapX =
            ratioX * (maxPos.current.x - minPos.current.x) + minPos.current.x;
        const realMapY =
            ratioY * (maxPos.current.y - minPos.current.y) + minPos.current.y;

        let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        newScale = Math.max(0.05, Math.min(newScale, 100));
        setScale(newScale);

        const newRatioX =
            (realMapX - minPos.current.x) / (maxPos.current.x - minPos.current.x);
        const newRatioY =
            (realMapY - minPos.current.y) / (maxPos.current.y - minPos.current.y);

        setOffset({
            x: mouseX - newRatioX * (width * newScale),
            y: mouseY - newRatioY * (height * newScale),
        });
    };

    // 드래그 이동
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const { x, y } = getCanvasMousePos(e);
        setLastMousePos({ x, y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", background: "#fff" }}
                onClick={handleCanvasClick}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                    handleMouseMove(e);
                    if (isDragging) {
                        const { x, y } = getCanvasMousePos(e);
                        const dx = x - lastMousePos.x;
                        const dy = y - lastMousePos.y;
                        setOffset((prev) => ({
                            x: prev.x + dx,
                            y: prev.y + dy,
                        }));
                        setLastMousePos({ x, y });
                    }
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default MapCanvas;