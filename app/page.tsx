'use client'

import { SetStateAction, useState} from 'react'
import {Cursors, id, init, tx} from '@instantdb/react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Plus, Loader2} from 'lucide-react'

const db = init<{
    players: {
        id: string;
        name: string;
        clicks: number;
    },
    cursor: {
        presence: {
            name: string
        }
    }
}>({
    appId: "00b7eeac-4f11-4095-8df4-0d037679c915",
});

const room = db.room('cursor', '123');

export default function ClickCounter() {
    const [playerName, setPlayerName] = useState('')
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

    const {data, isLoading, error} = db.useQuery({
        players: {},
    });

    room.useSyncPresence({
        name: playerName
    });

    async function handleJoinGame(e: React.FormEvent) {
        e.preventDefault()
        if (!playerName.trim()) return;

        const newPlayerId = id();
        db.transact([
            tx.players[newPlayerId].update({
                name: playerName.trim(),
                clicks: 0,
            }),
        ]);

        setCurrentPlayerId(newPlayerId)
    }

    async function handleClick() {
        if (!currentPlayerId) return;

        const currentPlayer = data?.players.find(player => player.id === currentPlayerId);
        if (currentPlayer) {
            db.transact([
                tx.players[currentPlayerId].update({
                    clicks: (currentPlayer.clicks || 0) + 1,
                }),
            ]);
        }
    }

    if (error) return <p className="p-4 flex items-center">Oops, something went wrong</p>;

    return (
        <Cursors room={room} renderCursor={(props) => (
            <NameCursor color={props.color} name={props.presence.name} />
        )} userCursorColor={randomDarkColor} className={cursorsClassNames}>
            <div className="container mx-auto p-4 max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Click Counter Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!currentPlayerId ? (
                            <form onSubmit={handleJoinGame} className="space-y-4 mb-6">
                                <div>
                                    <Label htmlFor="playerName">Your Name</Label>
                                    <Input
                                        id="playerName"
                                        type="text"
                                        value={playerName}
                                        onChange={(e: {
                                            target: { value: SetStateAction<string> }
                                        }) => setPlayerName(e.target.value)}
                                        placeholder="Enter your name"
                                        required
                                        minLength={1}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={!playerName.trim()}>
                                    <Plus className="w-4 h-4 mr-2"/> Join Game
                                </Button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <p className="text-lg font-semibold">Welcome, {playerName}!</p>
                                <Button onClick={handleClick} size="lg" className="w-32 h-32 rounded-full text-2xl">
                                    Click Me!
                                </Button>
                            </div>
                        )}
                        {isLoading ? (
                            <div className="flex justify-center items-center">
                                <Loader2 className="w-6 h-6 animate-spin"/>
                            </div>
                        ) : data?.players.length ? (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
                                <ul className="space-y-2">
                                    {data.players
                                        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                                        .map((player) => (
                                            <li key={player.id}
                                                className="flex items-center justify-between bg-secondary p-2 rounded-md">
                                                <span>{player.name}</span>
                                                <span className="font-semibold">{player.clicks || 0} clicks</span>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="italic text-muted-foreground text-center">No players yet!</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <p className="text-sm text-muted-foreground">Total players: {data?.players.length || 0}</p>
                    </CardFooter>
                </Card>
            </div>
        </Cursors>
    )
}

function NameCursor({ color, name }: { color?: string; name: string }) {
    return (
        <span
            className="rounded-b-xl rounded-r-xl border-2 bg-white/30 px-3 text-xs shadow-lg backdrop-blur-md"
            style={{
                borderColor: color ?? 'gray',
            }}
        >
      {name}
    </span>
    );
}

const randomDarkColor = '#' + [0, 0, 0].map(() => Math.floor(Math.random() * 200).toString(16).padStart(2, '0')).join('');
const cursorsClassNames =
    'flex h-screen w-screen items-center justify-center overflow-hidden font-mono text-sm text-gray-800';