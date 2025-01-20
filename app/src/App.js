import React, { useState, useEffect } from "react";
import "./App.css";
import MenuBar from "./components/MenuBar";
import MapCanvas from "./components/MapCanvas";
import InfoPanel from "./components/InfoPanel";
import Modal from "./components/Modal";
import PathModal from "./components/PathModal";
import MovementControl from "./components/MovementControl";
import SettingsModal from "./components/SettingsModal";
//import useUdpReceiver from "./utils/useUdpReceiver";


function App() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [amrIp, setAmrIp] = useState("");
  const [amrPosition, setAmrPosition] = useState(null); // AMR 위치 상태
  //const udpPort = 19301;

  //const [robotData, setRobotData] = useState(null);
  //const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    // 메인 프로세스에서 전송된 로봇 데이터를 수신
    window.electronAPI.onRobotDataUpdate((data) => {
      console.log('Updating robot data in App:', data);
      setRobotData(data);
      setIsPopupVisible(true); // 데이터 수신 시 팝업 표시
    });
  }, []);

  // const closePopup = () => {
  //   setIsPopupVisible(false);
  // };

  useEffect(() => {
    window.electronAPI.on('slam-data', (data) => {
      console.log('Received SLAM data:', data);

      // mapData 업데이트
      setMapData((prevData) => ({
        ...prevData,
        normalPosList: data.points || [], // SLAM에서 받은 좌표 추가
      }));
    });

    return () => {
      window.electronAPI.removeAllListeners('slam-data');
    };
  }, []);
  useEffect(() => {
    const handlePushData = (data) => {
      console.log('Received AMR data:', data);
      setAmrPosition({ x: data.x, y: data.y, angle: data.angle });
    };

    window.electronAPI.onPushData(handlePushData);

    return () => {
      window.electronAPI.unsubscribeFromPushData();
    };
  }, []);

  const startPushData = async () => {
    try {
      await window.electronAPI.subscribeToPushData(amrIp, 19301);
      console.log('Subscribed to push data');
    } catch (error) {
      console.error('Error subscribing to push data:', error);
    }
  };
  const stopPushData = async () => {
    try {
      await window.electronAPI.unsubscribeFromPushData();
      console.log('Unsubscribed from push data');
    } catch (error) {
      console.error('Error unsubscribing from push data:', error);
    }
  };

  useEffect(() => {
    const savedAmrIp = localStorage.getItem("amrIp");
    if (savedAmrIp) {
      setAmrIp(savedAmrIp);
    }
  }, []);



  const handleSaveAmrIp = (newIp) => {
    setAmrIp(newIp);
    console.log("Saved AMR IP:", newIp);
  };


  const [mapData, setMapData] = useState({
    header: {
      minPos: { x: 0, y: 0 },
      maxPos: { x: 1000, y: 1000 },
    },
    normalPosList: [],
    advancedPointList: [],
    advancedLineList: [],
    advancedCurveList: [],
  });
  const [clickedObject, setClickedObject] = useState(null);

  // 오브젝트 클릭 핸들러
  const handleObjectClick = (object) => {
    setClickedObject(object); // InfoPanel 열기
  };
  const handleAddPath = (startStation, stopStation) => {
    const newPath = {
      className: "DegenerateBezier",
      instanceName: `${startStation.instanceName}-${stopStation.instanceName}`,
      startPos: {
        instanceName: startStation.instanceName,
        pos: startStation.pos,
      },
      endPos: {
        instanceName: stopStation.instanceName,
        pos: stopStation.pos,
      },
      controlPos1: {
        x: (startStation.pos.x + stopStation.pos.x) / 2,
        y: (startStation.pos.y + stopStation.pos.y) / 2,
      },
      controlPos2: {
        x: (startStation.pos.x + stopStation.pos.x) / 2,
        y: (startStation.pos.y + stopStation.pos.y) / 2,
      },
      property: [
        { key: "direction", type: "int", int32Value: 1 },
        { key: "movestyle", type: "int", int32Value: 0 },
        { key: "maxspeed", type: "double", doubleValue: 0.3 },
        { key: "maxdec", type: "double", doubleValue: 0.3 },
      ],
    };

    setMapData((prevData) => ({
      ...prevData,
      advancedCurveList: [...prevData.advancedCurveList, newPath],
    }));

    alert(`경로가 추가되었습니다: ${newPath.instanceName}`);
    setActiveMenu(null); // 메뉴 상태 초기화
  };

  const handleObjectUpdate = (updatedObject) => {
    console.log("Updating object:", updatedObject);
    setMapData((prevData) => {
      if (updatedObject.type === "advancedPoint") {
        return {
          ...prevData,
          advancedPointList: prevData.advancedPointList.map((point) =>
            point.instanceName === updatedObject.instanceName
              ? { ...point, ...updatedObject.data }
              : point
          ),
        };
      } else if (updatedObject.type === "advancedCurve") {
        return {
          ...prevData,
          advancedCurveList: prevData.advancedCurveList.map((curve) =>
            curve.instanceName === updatedObject.instanceName
              ? { ...curve, ...updatedObject.data }
              : curve
          ),
        };
      }
      return prevData;
    });
  };

  const handleObjectDelete = (object) => {
    console.log("Deleting object:", object);
    setMapData((prevData) => {
      if (object.type === "advancedPoint") {
        return {
          ...prevData,
          advancedPointList: prevData.advancedPointList.filter(
            (point) => point.instanceName !== object.data.instanceName
          ),
        };
      } else if (object.type === "advancedCurve") {
        return {
          ...prevData,
          advancedCurveList: prevData.advancedCurveList.filter(
            (curve) => curve.instanceName !== object.data.instanceName
          ),
        };
      }
      return prevData;
    });
    setClickedObject(null);
  };

  const handleAddStation = (mapX, mapY) => {
    const newStation = {
      instanceName: `Station_${mapData.advancedPointList.length + 1}`,
      pos: { x: mapX, y: mapY },
      dir: 0, // 기본 방향
    };

    console.log("Adding new station at user-defined coordinates:", newStation.pos);

    setMapData((prevData) => ({
      ...prevData,
      advancedPointList: [...prevData.advancedPointList, newStation],
    }));

    alert(`새로운 스테이션이 추가되었습니다: ${newStation.instanceName}`);

    // 메뉴 상태를 원상태로 복원
    setActiveMenu(null);
    setIsModalOpen(false); // 스테이션 추가 모달 닫기
  };


  const handleMenuClick = (menuIndex) => {
    console.log(`Menu clicked: ${menuIndex}`); // 디버그 로그 추가

    if (menuIndex === 3) {
      setIsModalOpen(true); // 스테이션 추가 모달 열기
    } else if (menuIndex === 2) {
      console.log("Opening Path Modal"); // 디버그 로그 추가
      setIsPathModalOpen(true); // 경로 추가 모달 열기
    } else if (menuIndex === 4) {
      setIsSettingsModalOpen(true);
    } else if (menuIndex === 2) {
      if (
        window.confirm(
          "새 맵을 스캔하시겠습니까? 현재 작업 중이던 맵 정보는 저장되지 않습니다."
        )
      ) {
        //handleSlamRequest();
        setActiveMenu(menuIndex);
      }
    } else {
      setActiveMenu(menuIndex);
    }
    setActiveMenu(menuIndex);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveMenu(null); // 메뉴 상태 초기화
  };

  const closePathModal = () => {
    console.log("Closing Path Modal"); // 디버그 로그 추가
    setIsPathModalOpen(false);
    setActiveMenu(null);
  };
  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setActiveMenu(null);
  };


  // 맵 데이터 로드
  useEffect(() => {
    const handleFileOpened = (data) => {
      if (
        data.header &&
        data.header.minPos &&
        data.header.maxPos &&
        Array.isArray(data.normalPosList) &&
        Array.isArray(data.advancedPointList) &&
        Array.isArray(data.advancedLineList) &&
        Array.isArray(data.advancedCurveList)
      ) {
        setMapData(data);
      } else {
        alert("유효하지 않은 맵 데이터 형식입니다.");
      }
    };

    window.electronAPI.onFileOpened(handleFileOpened);

    return () => {
      window.electronAPI.removeFileOpenedListener();
    };
  }, []);
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.handleGetMapData) {
      console.log('Registering get-map-data handler');
      window.electronAPI.handleGetMapData(() => mapData);
    } else {
      console.warn('electronAPI.handleGetMapData is not available');
    }
  }, [mapData]);


  useEffect(() => {
    const handleMapDataUpdated = (newMapData) => {
      //console.log('Event object:', event);
      console.log('Received newMapData in App.js:', newMapData);

      if (!newMapData) {
        console.error('newMapData is undefined in App.js');
        return;
      }

      setMapData(newMapData);
    };

    window.electronAPI.on('map-data-updated', handleMapDataUpdated);

    return () => {
      window.electronAPI.removeListener('map-data-updated', handleMapDataUpdated);
    };
  }, []);

  useEffect(() => {
    const handleSlamData = (data) => {
      console.log('Received SLAM data:', data);

      // 데이터가 유효하면 상태 업데이트
      if (data && Array.isArray(data.points)) {
        setMapData((prevData) => ({
          ...prevData,
          normalPosList: [...prevData.normalPosList, ...data.points],
        }));
      } else {
        console.error('Invalid SLAM data format:', data);
      }
    };

    // Electron에서 SLAM 데이터를 수신
    window.electronAPI.onSlamData(handleSlamData);

    return () => {
      window.electronAPI.removeListener('slam-data', handleSlamData);
    };
  }, []);

  useEffect(() => {
    window.mapData = mapData; // mapData를 전역 변수로 설정
    console.log('window.mapData updated:', window.mapData); // 디버깅용 로그
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('Sending mapData to main process:', mapData);
      window.electronAPI.sendMapDataToMain(mapData);
    }
  }, [mapData]);





  return (
    <div>
      <MenuBar
        activeMenu={activeMenu}
        setActiveMenu={handleMenuClick}
        mapData={mapData}
        amrIp={amrIp} // 추가
        startPushData={startPushData}
        stopPushData={stopPushData}
      />
      <div style={{ paddingTop: "8vh", width: "100vw", height: "92vh" }}>
        <MapCanvas
          mapData={mapData}
          onCanvasClick={() => { }} // 별도의 캔버스 클릭 동작 없음
          onObjectClick={handleObjectClick} // 마우스 클릭 시 오브젝트 선택
          activeMenu={activeMenu}
          amrPosition={amrPosition}
        />
        <InfoPanel
          visible={!!clickedObject}
          objectData={clickedObject}
          activeMenu={activeMenu}
          onUpdate={handleObjectUpdate}
          onDelete={handleObjectDelete}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddStation} // 사용자 입력 좌표를 처리

      />
      <PathModal
        isOpen={isPathModalOpen}
        onClose={closePathModal}
        onSubmit={handleAddPath}
        advancedPointList={mapData.advancedPointList}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        onSave={handleSaveAmrIp}
      />
      <MovementControl amrIp={amrIp} />

    </div>
  );
}

export default App;
