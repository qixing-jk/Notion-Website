import styles from './AISummary.module.css'
import { useGlobal } from '@/lib/global'

const AISummary = ({ aiSummary }) => {
  const { locale } = useGlobal()

  return (
    aiSummary && (
      <div className={styles['post-ai']}>
        <div className={styles['ai-container']}>
          <div className={styles['ai-header']}>
            <div className={styles['ai-icon']}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                width='24'
                height='24'>
                <path
                  fill='#ffffff'
                  d='M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z'
                />
              </svg>
            </div>
            <div className={styles['ai-title']}>{locale.AI_SUMMARY.NAME}</div>
            <div className={styles['ai-tag']}>GPT</div>
          </div>
          <div className={styles['ai-content']}>
            <div className={styles['ai-explanation']}>{aiSummary}</div>
          </div>
        </div>
      </div>
    )
  )
}

export default AISummary
