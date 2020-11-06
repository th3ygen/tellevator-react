import React, { Component } from 'react';
import ReactPlayer from 'react-player';

export class VideoPlayer extends Component {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            playlist: [],
            index: 0
        };

        this.next = this.next.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        (async () => {
            if (this.state.playlist.length === 0) {
                const res = await (await fetch('res.json')).json();
            
                if (this._isMounted) {
                    this.setState({ playlist: res.playlist });
                }
            }
            
        })();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    next() {
        console.log('next');
        this.setState({ index: (this.state.index + 1) % this.state.playlist.length })
    }

    render() {
        return (
            <div>
                <ReactPlayer
                    playing
                    
                    height='100vh'
                    width='100%'

                    url={this.state.playlist[this.state.index]}
                    onEnded={() => this.next()}
                ></ReactPlayer>
            </div>
        )
    }
}

export default VideoPlayer
