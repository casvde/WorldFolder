import * as THREE from 'three';

function visualizeColliders(colliders, scene, color = 0xff0000) {

    const toRemove = [];
    scene.traverse(object => {
        if (object.userData.isColliderVisualization) {
            toRemove.push(object);
        }
    });
    toRemove.forEach(obj => scene.remove(obj));

    const material = new THREE.MeshBasicMaterial({
        color: color,
        opacity: 0.04,
        transparent: true,
        side: THREE.DoubleSide
    });

    colliders.forEach(collider => {
        const geometry = new THREE.PlaneGeometry(collider.size, collider.size);
        const plane = new THREE.Mesh(geometry, material);

        plane.position.set(
            collider.position.x + collider.size / 2,
            collider.position.y + collider.size / 2 - 0.45,
            collider.position.z + 0.5
        );

        plane.rotation.x = -Math.PI / 2;

        plane.userData.isColliderVisualization = true;

        scene.add(plane);
    });
}




function printGridDom(grid, divId) {
    const container = document.getElementById(divId);
    if (!container) {
        console.error(`Div with id "${divId}" not found.`);
        return;
    }

    container.innerHTML = '';

    const label = document.createElement('div');
    label.textContent = `Grid: ${divId}`;
    label.style.cursor = 'pointer';
    label.style.marginTop = '5px';

    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'block';
    gridWrapper.style.fontFamily = 'monospace';

    label.addEventListener('click', () => {
        gridWrapper.style.display = gridWrapper.style.display === 'none' ? 'block' : 'none';
    });

    const fragment = document.createDocumentFragment();

    grid.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.lineHeight = '0';

        row.forEach((value) => {
            const span = document.createElement('span');
            span.textContent = value;

            span.style.display = 'inline-block';
            span.style.width = '8px';
            span.style.height = '8px';
            span.style.textAlign = 'center';
            span.style.lineHeight = '8px';
            span.style.margin = '1px';
            span.style.fontSize = '14px';


            if (value === 0) {
                span.style.opacity = '0.1';
            }

            rowDiv.appendChild(span);
        });

        fragment.appendChild(rowDiv);
    });

    gridWrapper.appendChild(fragment);
    container.appendChild(label);
    container.appendChild(gridWrapper);
}



export {
    visualizeColliders,
    printGridDom
};
