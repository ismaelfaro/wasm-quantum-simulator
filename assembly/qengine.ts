// define some constants/types to use in the APP.
const r2 = Math.SQRT1_2
const pi = Math.PI

class Complex {
    constructor(
        public re: f64 = 0,
        public im: f64 = 0,
    ) {}

    squaredAbs(): f64 {
        return this.re * this.re + this.im * this.im
    }
}

enum GateType { X, H, Rx, Cx }

class Gate {
    constructor(
        public type: GateType,
        public qubit: i32,
        public target: i32 = 0,
        public theta: f64 = 0,
    ) {}

    toString(): string {
        let name = ''
        switch (this.type) {
            case GateType.X: name = 'x'; break;
            case GateType.H: name = 'h'; break;
            case GateType.Rx: name = 'rx'; break;
            case GateType.Cx: name = 'cx'; break;
        }
        return `[${name},${this.qubit},${this.target},${this.theta}]`
    }
}

class QuantumCircuit {
    Bits: i32;
    circuit: Array<Gate>;

    constructor(public Qubits: i32) {
        if (Qubits <= 0) console.error("Number of Qubits need to be more than 0")
        if (Qubits > 32) console.error("Number of Qubits need to less than 32")
        this.Bits = Qubits
        this.circuit = []
    }

    addGate(gate: Gate): void { this.circuit.push(gate) }

    x(qubit: i32): void { this.addGate(new Gate(GateType.X, qubit)) }
    h(qubit: i32): void { this.addGate(new Gate(GateType.H, qubit)) }
    rx(qubit: i32, theta:  f64): void { this.addGate(new Gate(GateType.Rx, qubit, 0, theta)) }
    cx(qubit: i32, target: i32): void { this.addGate(new Gate(GateType.Cx, qubit, target, 0)) }

    ry(qubit: i32, theta: f64): void {
        this.rx(qubit, pi / 2);
        this.h(qubit);
        this.rx(qubit, theta);
        this.h(qubit);
        this.rx(qubit,-pi / 2);
    }

    rz(qubit: i32, theta: f64): void {
        this.h(qubit);
        this.rx(qubit, theta);
        this.h(qubit);
    }

    z(qubit: i32): void { this.rz(qubit,pi) }
    y(qubit: i32): void { this.rz(qubit,pi); this.x(qubit) }

    toString(): string {
        return this.circuit.toString()
    }
}

class QuantumSimulator {
    circuit: Array<Gate>
    Qubits: i32
    Bits: i32
    stateVector: Array<Complex>

    constructor(quantumCircuit: QuantumCircuit) {
        const qubits = quantumCircuit.Qubits
        this.circuit = quantumCircuit.circuit
        this.Qubits = qubits
        this.Bits = qubits
        this.stateVector = new Array(2 ** qubits)
        this.initializeStateVector()
    }

    initializeStateVector(): void  {
        this.stateVector[0] = new Complex(1, 0);
        for (let i = 1, len = this.stateVector.length; i < len; ++i) {
            this.stateVector[i] = new Complex()
        }
    }

    superpose(x: Complex,y: Complex): StaticArray<Complex> {
        const
            xr = x.re, yr = y.re,
            xi = x.im, yi = y.im
        return [
            new Complex(r2 * (xr + yr), r2 * (xi + yi)),
            new Complex(r2 * (xr - yr), r2 * (xi - yi))
        ]
    }

    turn(x: Complex, y: Complex, theta: f64): StaticArray<Complex> {
        const
            xr = x.re, yr = y.re,
            xi = x.im, yi = y.im,
            tc = Math.cos(theta / 2),
            ts = Math.sin(theta / 2)
        return [
            new Complex(xr * tc + yi * ts, xi * tc - yr * ts),
            new Complex(yr * tc + xi * ts, yi * tc - xr * ts)
        ]
    }

    probability(shots: i32): string[] {
        let probabilities = this.stateVector.map<f64>(value => value.squaredAbs())
        let probLength = probabilities.length
        let output: string[] = []
        for (let shotsCount = 0; shotsCount < shots; shotsCount++) {
            let cumu = 0.0
            let un = true
            let r = Math.random()
            for (let i = 0; i < probLength; i++) {
                cumu += probabilities[i]
                if (r < cumu && un) {
                    let raw_output = i.toString(2).padStart(this.Qubits, '0')
                    output.push(raw_output)
                    un = false
                }
            }
        }
        return output
    }

    statevector(): string {
        let output = ""
        for (let i = 0, len = this.stateVector.length; i < len; ++i) {
            let value = this.stateVector[i]
            let bits = i.toString(2).padStart(this.Qubits, '0')
            output += `${bits} ${value.re}+${value.im}j\n`
        }
        return output
    }

    memory(shots: i32 = 1024): string[] {
        return this.probability(shots)
    }

    counts(shots: i32 = 1024): Map<string,i32> {
        let probabilities = this.probability(shots);
        let counts = new Map<string,i32>()
        for (let i = 0, len = probabilities.length; i < len; i++) {
            let value = probabilities[i]
            if (counts.has(value)) {
                counts.set(value, counts.get(value) + 1)
            } else {
                counts.set(value, 1)
            }
        }
        return counts
    }

    toString(): string {
        return this.counts().keys().toString()
    }

    run(shots: i32 = 1024): void {
        for (let i = 0, len = this.circuit.length; i < len; ++i) {
            let gate = this.circuit[i]
            let type = gate.type
            // one Gate instructions
            if (type == GateType.X || type == GateType.H || type == GateType.Rx) {
                const contQubitLimit = 2 ** gate.qubit
                const contStateLimit = 2 ** (this.Qubits - gate.qubit - 1)
                const contQubitMax = 2 ** (gate.qubit + 1)
                const contStateMax = 2 ** (gate.qubit + 0)
                for (let contQubit = 0; contQubit < contQubitLimit; ++contQubit) {
                    for (let contState = 0; contState < contStateLimit; ++contState) {
                        let b0 = contQubit + contQubitMax * contState
                        let b1 = b0 + contStateMax
                        if (gate.type == GateType.X) {
                            let temp = this.stateVector[b0]
                            this.stateVector[b0] = this.stateVector[b1]
                            this.stateVector[b1] = temp
                        }
                        if (gate.type == GateType.H) {
                            let superpositionResult = this.superpose(
                                this.stateVector[b0],
                                this.stateVector[b1]
                            );
                            this.stateVector[b0] = superpositionResult[0]
                            this.stateVector[b1] = superpositionResult[1]
                        }
                        if (gate.type == GateType.Rx) {
                            let turn = this.turn(
                                this.stateVector[b0],
                                this.stateVector[b1],
                                gate.theta
                            );
                            this.stateVector[b0] = turn[0]
                            this.stateVector[b1] = turn[1]
                        }
                    }
                }
            } else {
                // two Gates Instructions
                if (type == GateType.Cx) {
                    let loopLimit0 = gate.qubit
                    let loopLimit1 = gate.target
                    if (gate.target < gate.qubit) {
                        loopLimit0 = gate.target
                        loopLimit1 = gate.qubit
                    }
                    const cx0Limit = 2 ** loopLimit0
                    const cx1Limit = 2 ** (loopLimit0 - loopLimit1 - 1)
                    const cx2Limit = 2 ** (this.Qubits - loopLimit1 - 1)

                    const cx0Max = 2 ** (loopLimit0 + 1)
                    const cx1Max = 2 ** (loopLimit1 + 1)
                    const cx2Max = 2 ** gate.qubit
                    const b0Max  = 2 ** gate.target

                    for (let cx0 = 0; cx0 < cx0Limit; cx0++) {
                        for (let cx1 = 0; cx1 < cx1Limit; cx1++) {
                            for (let cx2 = 0; cx2 < cx2Limit; cx2++) {
                                let b0 = cx0 + cx0Max * cx1 + cx1Max * cx2 + cx2Max
                                let b1 = b0 + b0Max
                                let temp = this.stateVector[b0]
                                this.stateVector[b0] = this.stateVector[b1]
                                this.stateVector[b1] = temp
                            }
                        }
                    }
                }
            }
        }
    }
}


export function runQuantumSimulator(qubits: i32): string {
    let qc = new QuantumCircuit(qubits)
    qc.h(0)
    qc.cx(0, 1)

    let qs = new QuantumSimulator(qc)
    qs.run()

    return qs.statevector()
}
