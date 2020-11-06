import React, { Component, createRef } from 'react';
import './styles.scss';

export class Dashboard extends Component {

    constructor(props) {
        super(props);

        this.clockInterval = createRef();
        
        this.state = {
            socket: props.socket,
            lifts: [],

            time: this.getTime()
        };
    }

    componentDidMount() {
        this.clockInterval.current = setInterval(() => {
            this.setState({ time: this.getTime() });
        }, 1000);

        this.state.socket.on('users', users => {
            const lifts = [];

            Object.keys(users).forEach(e => {
                if (!users[e].admin) {
                    lifts.push(e);
                }
            });

            if (lifts.length > 0) {
                this.setState({ lifts });
            }
        });

        this.state.socket.emit('requestUsers');
    }

    componentWillUnmount() {
        clearInterval(this.clockInterval.current);
    }

    // https://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no
    getTime() {
        let time = new Date(Date.now()).toString().split(' ')[4];

        // Check correct time format and split into components
        time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
        
        if (time.length > 1) { // If time format correct
            time = time.slice (1);  // Remove full string match value
            time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
            time[0] = +time[0] % 12 || 12; // Adjust hours
        }
        return time.join (''); // return adjusted time or original string
    }

    render() {
        return (
            <div className='Dashboard-wrapper'>
                <div className="Dashboard-sidebar">
                    <div className="Dashboard-header">
                        <span>All lift</span>
                    </div>
                    <div className="Dashboard-lift-items">
                        {
                            this.state.lifts.map((k, x) => (
                                <div key={x} className={`Dashboard-lift-item`}>
                                    <div className="Dashboard-lift-name">{k}</div>
                                    <div className='Dashboard-lift-status'>{'Active'}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className="Dashboard-container">
                    <div className="Dashboard-clock">
                        {this.state.time}
                    </div>
                </div>
            </div>
        )
    }
}

export default Dashboard
