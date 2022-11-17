import React, { useState, useEffect } from 'react';
import BarChart, { IotChart } from './Chart.js';
import Clock from './Clock.js';
import './Bluetooth.js';
import styles from './modules/HomePage.module.css';
//import { Menu } from './Menu.js';







export default function HomePage() {
  const [supportsBluetooth, setSupportsBluetooth] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [acceleration, setAcceleration] = useState(null);
  const [ecg, setEcg] = useState(null);

  // When the component mounts, check that the browser supports Bluetooth
  useEffect(() => {
    if (navigator.bluetooth) {
      setSupportsBluetooth(true);
    }
  }, []);

  /**
   * Let the user know when their device has been disconnected.
   */
  const onDisconnected = (event) => {
    alert(`The device ${event.target} is disconnected`);
    setIsDisconnected(true);
  }

  /**
   * Update the value shown on the web page when a notification is
   * received.
   */
  const handleCharacteristicValueChanged = (event) => {
    setBatteryLevel(event.target.value.getUint8(0) + '%');
  }

  const handleAccValueChanged = (event) => {
    setAcceleration(event.target.value.getUint8(0));
  }

  const handleEcgValueChanged = (event) => {
    setEcg(event.target.value.getUint8(0));
  }

  /**
   * Attempts to connect to a Bluetooth device and subscribe to
   * battery level readings using the battery service.
   */

   



  const connectToDeviceAndSubscribeToUpdates = async () => {
    try {
      // Search for Bluetooth devices that advertise a battery service
      const device = await navigator.bluetooth
        .requestDevice(options);

      setIsDisconnected(false);

      // Add an event listener to detect when a device disconnects
      device.addEventListener('gattserverdisconnected', onDisconnected);

      // Try to connect to the remote GATT Server running on the Bluetooth device
      const server = await device.gatt.connect();

      // Get the battery service from the Bluetooth device
      const batService = await server.getPrimaryService('battery_service');

      const accService = await server.getPrimaryService('fb005c80-02e7-f387-1cad-8acd2d8df0c8');

      // Get the battery level characteristic from the Bluetooth device
      const characteristic = await batService.getCharacteristic('battery_level');

      const pmdControlCharacteristic = await accService.getCharacteristic('fb005c81-02e7-f387-1cad-8acd2d8df0c8');

      const pmdDataCharacteristic = await accService.getCharacteristic('fb005c82-02e7-f387-1cad-8acd2d8df0c8');

      pmdControlCharacteristic.writeValueWithResponse(new Uint8Array([0x02, 0x03]));

      pmdDataCharacteristic.startNotifications();

      pmdDataCharacteristic.addEventListener('characteristicValueChanged',
        handleCharacteristicValueChanged);

      // Subscribe to battery level notifications
      characteristic.startNotifications();

      // When the battery level changes, call a function
/*       characteristic.addEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged); */

      // Read the battery level value
      const reading = await characteristic.readValue();
      const readingAcc = await pmdControlCharacteristic.readValue();
      setAcceleration(readingAcc.getUint8(1));

      // Show the initial reading on the web page
      setBatteryLevel(reading.getUint8(0) + '%');
    } catch (error) {
      console.log(`There was an error: ${error}`);
    }
  };



  return (
    <div className={ styles.background }>
        <div className={ styles.header }>
            <img id="companyLogo" className={ styles.companyLogo } alt='Company Logo'/>
            <button onClick={onClickEvent} className={styles.connectButton}>Connect device</button>
        </div>
        <div className={ styles.statsContainer }>
            <div className={ styles.smallColumn }>
                <div className={ styles.dataText }>0</div>
                <div className={ styles.dataUnit }>km/h</div>
            </div>
            <div className={ styles.smallColumn }>
                <Clock/> 
            </div>
        </div>
            <div className={ styles.statsContainer }>
                <div className={ styles.smallColumn }>
                    <div className={ styles.dataText }>60</div>
                    <div className={ styles.dataUnit }>Lowest BPM</div>
                </div>
                <div className={ styles.smallColumn }>
                    <img id="heartSprite" src = "./heart.png" alt="bpmHeartImage" hidden="true"/>
                    <div className={ styles.dataText }>0</div>
                    <div className={ styles.dataUnit }>BPM</div>
                </div>
                <div className={ styles.smallColumn }>
                    <div className={ styles.dataText }>120</div>
                    <div className={ styles.dataUnit }>Highest BPM</div>
                </div>
            </div>
            <div className={ styles.graphContainer }>
                <div className={ styles.bigColumn }>
                    <IotChart/>
                    <div className={ styles.graphName2 }>ECG</div>
                </div>
                <div className={ styles.bigColumn }>
                    <IotChart/>
                    <div className={ styles.graphName }>PPG</div>
                </div>
            </div>
    </div>
  );
}