import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import './styles.scss';

import WaveSurfer from 'wavesurfer.js';
import WaveSurferMic from 'wavesurfer.js/dist/plugin/wavesurfer.microphone';

import {
    CircularProgress
} from '@material-ui/core';
import {
    PersonOutline as UserIcon,
    LocationOn as LocationIcon,
    Today as CalendarIcon,
    QueryBuilder as ClockIcon,
    HourglassEmpty as HourGlassIcon,
    CallEnd as CallEndIcon
} from '@material-ui/icons';

import Peer from 'simple-peer';

class EmergencyAdmin extends Component {
    _isMounted = false;

    constructor(props) {
        super(props);
        
        this.streamRef = createRef();
        this.videoInputRef = createRef();
        this.audioInputRef = createRef();

        this.peer = createRef();

        const datetime = new Date(props.timestamp).toString().split(' ');

        // https://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no
        const tConvert = (time) => {
            // Check correct time format and split into components
            time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
            
            if (time.length > 1) { // If time format correct
                time = time.slice (1);  // Remove full string match value
                time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
                time[0] = +time[0] % 12 || 12; // Adjust hours
            }
            return time.join (''); // return adjusted time or original string
        }

        this.state = {
            socketId: props.socketId,
            callerSocketId: props.callerSocketId,
            callerSignal: props.callerSignal,
            socket: props.socket,

            ready: false,

            sidebar: {
                pic: {
                    icon: (<UserIcon />),
                    label: 'Lift on call',
                    val: props.pic
                },
                at: {
                    icon: (<LocationIcon />),
                    label: 'Location',
                    val:  props.at
                },
                date: {
                    icon: (<CalendarIcon />),
                    label: 'Date',
                    val: datetime.splice(1, 3).join(' ')
                },
                time: {
                    icon: (<ClockIcon />),
                    label: 'Time',
                    val: tConvert(datetime[1])
                },
                duration: {
                    icon: (<HourGlassIcon />),
                    label: 'Duration',
                    val: '00:00:00:000'
                }
            },

            stream: null
        };

        this.endCall = this.endCall.bind(this);
    }

    componentDidMount() {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                this.peer.current = new Peer({
                    initiator: false,
                    trickle: false,
                
                    stream
                });

                const peer = this.peer.current;

                peer.on('signal', data => {
                    if (data.type === 'answer') {
                        this.state.socket.emit('callAccept', {
                            signal: data,
                            to: this.state.callerSocketId
                        });

                        this.setState({
                            ready: true
                        });
                    }
                });

                peer.on('stream', data => {
                    this.streamRef.current.srcObject = data;
                });

                peer.on('error', err => {
                    console.error(err);
                });

                peer.signal(this.state.callerSignal);

                this.videoInputRef.current.srcObject = stream;

                const wave = WaveSurfer.create({
                    container: this.audioInputRef.current,
                    cursorWidth: 0,
                    height: 60,
                    waveColor: '#00A9A1',

                    plugins: [
                        WaveSurferMic.create()
                    ]
                });

                wave.microphone.start();
            } catch(err) {
                console.log('cant find camera', err);
            }

        })();
    }

    componentWillUnmount() {
        this.setState({
            ready: false
        });
        this.peer.current.destroy();
    }

    endCall() {
        this.state.socket.emit('callEnd', [this.state.socketId, this.state.callerSocketId]);
    }

    render() {
        return (
            <div className='wrapper'>
                <div className={`sidebar ${(this.state.ready) ? 'ready' : ''}`} >
                    <div className="sidebar-banner">
                        <span>
                            Attention!
                            <br/>
                            <span className='loading-text'>Connecting you to the lift...</span>
                        </span>
                    </div>
                    
                    <div className="loading-anim">
                        <CircularProgress size='50px' thickness={5} style={{color: '#AFAFAF'}}/>
                    </div>

                    <div className='info-panel'>
                        
                        <div className="info-panel-wrapper">
                            {
                                Object.keys(this.state.sidebar).map((key, x) => {
                                    const item = this.state.sidebar[key];
                                    return (
                                        <div key={x} className="info-item">
                                            <div className="info-label">
                                                <div className="info-icon">
                                                    {item.icon}
                                                </div>
                                                <div className="info-label">
                                                    {item.label}
                                                </div>
                                            </div>
                                            <div className="info-value">
                                                {item.val}
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            
                        </div>
                    </div>

                    <div className="admin-input-info">
                        <div className="video-input">
                            <video ref={this.videoInputRef} className='input-video-stream' autoPlay playsInline muted/>
                        </div>
                        <div className="btn-end-call" onClick={() => this.endCall()}>
                            <CallEndIcon style={{ margin: '0 auto' }}/>
                        </div>
                        <div className="audio-input">
                            <div id='wave' ref={this.audioInputRef}></div>
                        </div>
                    </div>
                </div>
                <div className="main-section">
                    <video ref={this.streamRef} className="admin-video-stream" autoPlay playsInline/>
                
                    {/* <div className="black-panel">
                        <div className="top-panel"></div>
                        <div className="bot-panel">
                            <div className="btn-end-call">
                                <CallEndIcon style={{ margin: '0 auto' }}/>
                            </div>
                        </div>
                    </div> */}
                </div>
            
                
            </div>
        )
    }
}

EmergencyAdmin.propTypes = {
    pic: PropTypes.string.isRequired,
    at: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired
};

export default EmergencyAdmin
