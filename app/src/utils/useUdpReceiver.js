import { useRef, useEffect } from "react";



const useUdpReceiver = (port, onData) => {
    const socketRef = useRef(null);

    const startListening = () => {
        if (socketRef.current) return; // 이미 실행 중이라면 중지

        const dgram = require("dgram");
        const socket = dgram.createSocket("udp4");

        socket.on("message", (msg) => {
            try {
                const data = JSON.parse(msg.toString()); // 메시지를 JSON으로 변환
                onData(data);
            } catch (error) {
                console.error("UDP 데이터 파싱 오류:", error);
            }
        });

        socket.on("error", (err) => {
            console.error("UDP 소켓 오류:", err);
            socket.close();
        });

        socket.bind(port, () => {
            console.log(`UDP 소켓이 포트 ${port}에서 수신 중입니다.`);
        });

        socketRef.current = socket;
    };

    const stopListening = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            console.log("UDP 소켓 수신 중지");
        }
    };

    useEffect(() => {
        return () => {
            stopListening(); // 컴포넌트 언마운트 시 수신 중지
        };
    }, []);

    return { startListening, stopListening };
};

export default useUdpReceiver;
