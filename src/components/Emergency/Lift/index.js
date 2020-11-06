import React, { Component, createRef } from 'react';
import './styles.scss';

import {
    CircularProgress
} from '@material-ui/core';
import {
    PersonOutline as UserIcon,
    LocationOn as LocationIcon,
    Today as CalendarIcon,
    QueryBuilder as ClockIcon,
    HourglassEmpty as HourGlassIcon
} from '@material-ui/icons';

import Peer from 'simple-peer';

class EmergencyLift extends Component {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.streamRef = createRef();
        this.peer = createRef();
        this.clockInterval = createRef();

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
            socket: props.socket,
            ready: false,

            sidebar: {
                pic: {
                    icon: (<UserIcon />),
                    label: 'PIC on call',
                    val: props.pic
                },
                at: {
                    icon: (<LocationIcon />),
                    label: 'You are at',
                    val: props.at
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
                    val: '00:00:00'
                }
            },
            duration: 0,

            loadingText: 'Loading...',

            stream: null
        };
    }

    componentDidMount() {
        const startCall = async (signal) => {
            return new Promise((resolve, reject) => {
                this.state.socket.on('callAccepted', data => {
                    return resolve(data);
                });
                this.state.socket.on('queue', () => {
                    this.setState({ loadingText: 'Operators are occupied, please hold on...' });
                });

                this.state.socket.emit('callRequest', {
                    signal,
                    from: this.state.socketId
                });
                
                /* this.state.socket.on('availableAdmins', data => {
                    this.state.socket.emit('callRequest', {
                        adminId: data.list[0],
                        signal,
                        from: this.state.socketId
                    });
                });

                this.state.socket.emit('getAvailableAdmin'); */
            });
        };

        (async () => {
            try {
                this.setState({ loadingText: 'Starting up...' });
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                
                this.peer.current = new Peer({
                    initiator: true,
                    trickle: false,
                
                    stream
                });

                const peer = this.peer.current;

                peer.on('signal', async data => {
                    this.setState({ loadingText: 'Connecting you to the security...' });
                    const signal = await startCall(data);

                    peer.signal(signal);

                    this.setState({
                        ready: true
                    });
                    
                });

                peer.on('stream', data => {
                    this.streamRef.current.srcObject = data;
                });

                peer.on('error', err => console.log('error establishing connection:', err));


            } catch(err) {
                console.log('cant find camera', err);
            }

        })();

        this.clockInterval.current = setInterval(() => {
            this.setState({ duration: this.state.duration + 1 });

            const d = `${Math.floor(this.state.duration / 3600)}:${Math.floor(this.state.duration / 60)}:${this.state.duration % 60}`;
            this.setState(prev => ({
                ...prev,
                sidebar: {
                    ...prev.sidebar,
                    duration: {
                        ...prev.sidebar.duration,
                        val: d
                    }
                }
            }));
        }, 1000);
    }

    componentWillUnmount() {
        window.location.href = 'http://10.26.23.119:3000/?lift=' + this.state.socketId;
        clearInterval(this.clockInterval.current);
    }

    render() {
        return (
            <div className='Lift-wrapper'>
                <div className={`Lift-sidebar ${(this.state.ready) ? 'ready' : ''}`} >
                    <div className="Lift-sidebar-banner">
                        <span>
                            Lift Emergency System
                            <br/>
                            <span className='Lift-loading-text'>{this.state.loadingText}</span>
                        </span>
                    </div>
                    
                    <div className="Lift-loading-anim">
                        <CircularProgress size='50px' thickness={5} style={{color: '#AFAFAF'}}/>
                    </div>

                    <div className='Lift-info-panel'>
                        
                        <div className="Lift-info-panel-wrapper">
                            {
                                Object.keys(this.state.sidebar).map((key, x) => {
                                    const item = this.state.sidebar[key];
                                    return (
                                        <div key={x} className="Lift-info-item">
                                            <div className="Lift-info-label">
                                                <div className="Lift-info-icon">
                                                    {item.icon}
                                                </div>
                                                <div className="Lift-info-label">
                                                    {item.label}
                                                </div>
                                            </div>
                                            <div className="Lift-info-value">
                                                {item.val}
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            
                        </div>
                    </div>
                </div>
                <video ref={this.streamRef} className="Lift-video-stream" autoPlay playsInline></video>
            </div>
        )
    }
}

/* EmergencyLift.propTypes = {
    socket: Pr
    pic: PropTypes.string.isRequired,
    at: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired
}; */

export default EmergencyLift
