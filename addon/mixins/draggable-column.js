import Ember from 'ember';

const {
  guidFor,
  computed
} = Ember;

let sourceColumn;

export default Ember.Mixin.create({
  classNameBindings: ['isDragging', 'isDragTarget', 'dragDirection'],
  attributeBindings: ['isDraggable:draggable'],

  dragDirection: computed('isDragTarget', function () {
    if(this.get('isDragTarget')) {
      return `drag-${this._getDragDirection()}`;
    }
  }).readOnly(),

  dragColumnGroup: computed('column._group', function() {
    const columnGroup = this.get('column._group');
    return columnGroup ? columnGroup.get('subColumns') : this.get('table.columns');
  }).readOnly(),

  isDropTarget: computed(function() {
    /*
      A column is a valid drop target only if its in the same group
     */
    return this.get('column._group') === sourceColumn.get('_group');
  }).volatile().readOnly(),

  dragStart(e) {
    this._super(...arguments);

    const column = this.get('column');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', guidFor(column));

    sourceColumn = column;
    this.set('isDragging', true);
    this.sendAction('onColumnDrag', sourceColumn, ...arguments);
  },

  dragEnter(e) {
    this._super(...arguments);

    if(this.get('isDropTarget')) {
      this.set('isDragTarget', this.get('column') !== sourceColumn);
      e.preventDefault();
      return false;
    }
  },

  dragOver(e) {
    this._super(...arguments);

    if(this.get('isDropTarget')) {
      e.preventDefault();
      return false;
    }
  },

  dragLeave() {
    this._super(...arguments);
    this.set('isDragTarget', false);
  },

  dragEnd() {
    this._super(...arguments);

    this.setProperties({
      isDragTarget: false,
      isDragging: false
    });

    /*
      If sourceColumn still references a column, it means that a successful
      drop did not happen.
     */
    if(sourceColumn) {
      this.sendAction('onColumnDrop', sourceColumn, false, ...arguments);
      sourceColumn = null;
    }
  },

  drop(e) {
    this._super(...arguments);

    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetColumn = this.get('column');
    const columns = this.get('dragColumnGroup');

    let _columns = columns.toArray();
    let targetColumnIdx = _columns.indexOf(targetColumn);

    _columns.removeObject(sourceColumn);
    _columns.insertAt(targetColumnIdx, sourceColumn);
    columns.setObjects(_columns);

    this.setProperties({
      isDragTarget: false,
      isDragging: false
    });
    this.sendAction('onColumnDrop', sourceColumn, true, ...arguments);
    sourceColumn = null;
  },

  _getDragDirection() {
    const columns = this.get('dragColumnGroup');
    const targetIdx = columns.indexOf(this.get('column'));
    const sourceIdx = columns.indexOf(sourceColumn);

    return (sourceIdx - targetIdx) < 0 ? 'right' : 'left';
  }
});
