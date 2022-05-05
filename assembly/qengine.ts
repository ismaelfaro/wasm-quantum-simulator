// define some constants to use in the APP.
const r2=0.70710678118;
const pi=Math.PI;

// Define the Gate
class Gate{
  name: string;
  qubit: i32;
  target: i32;
  theta: f32;
  constructor(name:string, qubit:i32, target:i32, theta:f32){
    this.name = name;
    this.qubit = qubit;
    this.target = target;
    this.theta = theta;
  }
}

// Define the Quantum Circuit
class QuantumCircuit {
    Qubits: i32;
    Bits: i32;
    circuit: Array<Gate>;

    constructor(Qubits: i32){
        if (Qubits <= 0 ){
            console.error("Number of Qubits need to ne more than 0");
        } 
        this.Qubits = Qubits;
        this.Bits = Qubits;
        this.circuit = [];
    }

    addGate(gate:Gate){this.circuit.push(gate);}

    x(qubit:i32){this.addGate(new Gate('x',qubit,0,0.0));}

    rx(qubit:i32, theta:f32){ this.addGate(new Gate('rx',qubit, 0, theta));}

    ry(qubit:i32, theta:f32){
        this.rx(qubit,pi/2);
        this.h(qubit);
        this.rx(qubit,theta);
        this.h(qubit);
        this.rx(qubit,-pi/2);
    }

    rz(qubit:i32, theta:f32){
        this.h(qubit);
        this.rx(qubit,theta);
        this.h(qubit);
    }

    z(qubit:i32){ this.rz(qubit,pi) }

    y(qubit:i32){
        this.rz(qubit,pi);
        this.x(qubit)
    }

    h(qubit:i32){ this.addGate(new Gate('h',qubit,0,0.0)); }
    
    cx(qubit:i32,target:i32){ this.addGate(new Gate('cx',qubit,target,0.0)); }

    m(qubit:i32,target:i32){ this.addGate(new Gate('m',qubit,target,0.0)); }
}

class QuantumSimulator{
    circuit: Array<Gate>;
    Qubits: i32;
    Bits: i32;
    stateVector: Array<Array<f32>>

    constructor(quantumCircuit:QuantumCircuit){
        this.circuit = quantumCircuit.circuit;
        this.Qubits =  quantumCircuit.Qubits;
        this.Bits =  this.Qubits;
        this.stateVector = [];
    }

    initializeStateVector(){
        this.stateVector = new Array(Math.pow(2,this.Qubits));
        this.stateVector.fill([0.0,0.0]);
        this.stateVector[0]=[1.0,0.0];
    }

    probability(shots:i32){
        let probabilities:Array<f32> = []
        this.stateVector.forEach((value, index) =>{
            let realPart = value[0];
            let imaginaryPart = value[1];
            probabilities.push(Math.pow(realPart,2)+Math.pow(imaginaryPart,2))
        })

        let output:Array<String> = []
        for(let shotsCount=0; shotsCount < shots;shotsCount++){
            let cumu =0
            let un= true
            let r = Math.random()
            probabilities.forEach((value, index)=>{
                cumu+=value
                if(r < cumu && un){
                    let raw_output = index.toString(2).padStart(this.Qubits, '0');
                    output.push(raw_output)
                    un=false;
                }
            })
        }
        return output;
    }

    stateVector2str(){
        let output = "";
        this.stateVector.forEach((value, index) => {
            let bits = index.toString(2).padStart(this.Qubits, '0');
            output += bits +' '+ value[0].toString()+'+'+value[1].toString() +'j\n';
        })
        return output;
    }

    superpose(x:Array<f32>,y:Array<f32>){
        return [[r2*(x[0]+y[0]),r2*(x[1]+y[1])],
                [r2*(x[0]-y[0]),r2*(x[1]-y[1])]];
    };

    turn(x:Array<f32>,y:Array<f32>,theta:f32){
        let part1 = [x[0]*Math.cos(theta/2)+y[1]*Math.sin(theta/2),x[1]*Math.cos(theta/2)-y[0]*Math.sin(theta/2)]
        let part2 = [y[0]*Math.cos(theta/2)+x[1]*Math.sin(theta/2),y[1]*Math.cos(theta/2)-x[0]*Math.sin(theta/2)]
        return [ part1, part2]
    };

    run(format:String, shots:i32){
        
        format = format || "statevector";
        shots = shots || 1024;

        this.initializeStateVector();

        this.circuit.forEach((gate:Gate)=>{
            if (['x','h','rx'].includes(gate.name)){
                for(let contQubit=0; contQubit < Math.pow(2,gate.qubit); contQubit++){
                    for(let contState=0; contState < Math.pow(2,this.Qubits-gate.qubit-1); contState++){
                        let b0=contQubit+Math.pow(2,gate.qubit+1)*contState;
                        let b1=b0+Math.pow(2,gate.qubit);
                        if(gate.name == 'x'){
                            let temp = this.stateVector[b0]
                            this.stateVector[b0] = this.stateVector[b1]
                            this.stateVector[b1] = temp
                        }
                        if(gate.name == 'h') {
                            let superpositionResult = this.superpose(this.stateVector[b0],this.stateVector[b1]);
                            this.stateVector[b0] = superpositionResult[0];
                            this.stateVector[b1] = superpositionResult[1];
                        }
                        if(gate.name == 'rx'){
                            let turn = this.turn(this.stateVector[b0],this.stateVector[b1],gate.theta);
                            this.stateVector[b0] = turn[0];
                            this.stateVector[b1] = turn[1];
                        }
                    }   
                }
            }else{
                if(gate.name == 'cx'){
                    let loopLimit = [];
                    if(gate.target<gate.qubit){
                        loopLimit[0] = gate.target;
                        loopLimit[1] = gate.qubit;
                    } else {
                        loopLimit[1] = gate.target;
                        loopLimit[0] = gate.qubit;
                    }
                    for(let cx0=0;cx0<Math.pow(2,loopLimit[0]);cx0++){
                        for(let cx1=0;cx1<Math.pow(2,loopLimit[0]-loopLimit[1]-1);cx1++){
                            for(let cx2=0;cx2<Math.pow(2,this.Qubits-loopLimit[1]-1);cx2++){
                                let b0 =    cx0 + 
                                            Math.pow(2,loopLimit[0]+1)*cx1 +
                                            Math.pow(2,loopLimit[1]+1)*cx2 + 
                                            Math.pow(2,gate.qubit);

                                let b1 = b0 + Math.pow(2,gate.target)

                                let temp = this.stateVector[b0]
                                this.stateVector[b0] = this.stateVector[b1];
                                this.stateVector[b1] = temp;
                            }
                        }
                    }     
                }
            }
        });
    
        if (format == 'statevector'){
            return this.stateVector2str();
        } else if (format == 'memory'){
            return this.probability(shots);
        } else if(format == 'counts'){
            let probabilities = this.probability(shots);
            let counts:Object = {};
            probabilities.forEach((value:string, index)=>{
                if(value in counts){
                    counts[value]+=1;
                } else {
                    counts[value]=1;
                }
            });
            const orderedCounts = {};
            Object.keys(counts).sort().forEach(function(key) {
                orderedCounts[key] = counts[key];
            });
            return orderedCounts;
        }else{
            console.log('error: Valid output format [state vector, counts, memory]')
        }
    }
};